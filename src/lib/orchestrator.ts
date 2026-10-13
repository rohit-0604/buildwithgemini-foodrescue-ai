import { db } from './db';
import * as tools from './tools';
import { generateAgentCoordinationSummary } from './gemini';
import { Mission } from './types';

export interface OrchestrationStepResult {
  step: string;
  toolResult: tools.ToolResult;
}

export async function runOrchestrationCycle(donationId: string): Promise<{
  mission: Mission;
  steps: OrchestrationStepResult[];
}> {
  const steps: OrchestrationStepResult[] = [];
  const state = db.getState();
  const donation = state.donations.find(d => d.id === donationId);

  if (!donation) {
    throw new Error(`Donation ${donationId} not found`);
  }

  let mission = state.missions.find(m => m.donationId === donationId);
  if (!mission) {
    const initRes = await tools.createDonation(donation);
    mission = state.missions.find(m => m.donationId === donationId)!;
    steps.push({ step: 'createDonation', toolResult: initRes });
  }

  // 1. Safety & Guidelines Check
  const guidelinesRes = await tools.retrieveDonationGuidelines({
    foodCategory: donation.foodItems[0]?.category || 'Cooked Meals',
    storageCondition: donation.storageConditions,
    temperatureCelsius: donation.currentTempCelsius,
    durationHours: 1.5,
    hasAllergens: donation.foodItems.some(i => i.allergens.length > 0)
  });
  steps.push({ step: 'retrieveDonationGuidelines', toolResult: guidelinesRes });

  // 2. Readiness Check
  const readinessRes = await tools.checkDonationReadiness(donationId);
  steps.push({ step: 'checkDonationReadiness', toolResult: readinessRes });

  if (!readinessRes.data?.isReady) {
    mission.status = 'BLOCKED';
    mission.blockers = readinessRes.data?.blockers || ['Readiness check failed'];
    db.saveState();
    return { mission, steps };
  }

  // 3. Recipient Discovery
  const discoveryRes = await tools.findRegisteredRecipients(
    donation.coordinates,
    donation.dietaryTags,
    donation.remainingQuantity,
    15
  );
  steps.push({ step: 'findRegisteredRecipients', toolResult: discoveryRes });

  if (discoveryRes.status === 'BLOCKED') {
    mission.status = 'BLOCKED';
    mission.blockers = ['No suitable registered recipients found within 15km operational radius.'];
    db.saveState();
    return { mission, steps };
  }

  // 4. Calculate Allocation Plan
  const allocationRes = await tools.calculateAllocationPlan(donationId);
  steps.push({ step: 'calculateAllocationPlan', toolResult: allocationRes });

  const proposedAllocations = allocationRes.data || [];
  if (proposedAllocations.length > 0) {
    // 5. Send Recipient Requests
    for (const alloc of proposedAllocations) {
      const reqRes = await tools.requestRecipientAcceptance(donationId, alloc.recipientId, alloc.allocatedMeals);
      steps.push({ step: `requestRecipientAcceptance:${alloc.recipientName}`, toolResult: reqRes });
    }

    // 6. Volunteer Search
    const volRes = await tools.findAvailableVolunteers(
      donation.coordinates,
      undefined,
      proposedAllocations[0].allocatedMeals,
      donation.storageConditions === 'COLD'
    );
    steps.push({ step: 'findAvailableVolunteers', toolResult: volRes });

    if (volRes.data && volRes.data.length > 0) {
      const topVolunteer = volRes.data[0];
      const assignRes = await tools.requestVolunteerAssignment(mission.id, topVolunteer.id);
      steps.push({ step: `requestVolunteerAssignment:${topVolunteer.name}`, toolResult: assignRes });
    }
  }

  // 7. Gemini Reasoning Summary
  const summary = await generateAgentCoordinationSummary({
    missionTitle: mission.title,
    totalMeals: donation.totalQuantity,
    remainingMeals: donation.remainingQuantity,
    allocatedMeals: proposedAllocations.reduce((acc, a) => acc + a.allocatedMeals, 0),
    recipientResponses: mission.recipientResponses.map(r => ({
      recipientName: r.recipientName,
      status: r.status,
      acceptedQuantity: r.acceptedQuantity
    })),
    transportStatus: mission.transportAssignments[0]?.status || 'UNASSIGNED',
    safetyFlags: donation.safetyReview.flags
  });

  mission.reasoningSummary = summary.reasoning;
  mission.agentRecommendations = summary.recommendations;
  if (summary.blockers.length > 0) {
    mission.blockers = summary.blockers;
  }

  db.saveState();
  return { mission, steps };
}
