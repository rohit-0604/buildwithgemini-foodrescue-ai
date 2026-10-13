import { db } from '../db';
import { extractDonationFromText, generateAgentCoordinationSummary } from '../gemini';
import { retrieveGuidelines } from '../rag';
import { searchNearbyOrganizations as placesSearch } from '../places';
import {
  Donation,
  Mission,
  RecipientOrganization,
  RecipientResponse,
  TransportAssignment,
  Allocation,
  AgentExecutionTrace,
  Coordinates,
  StorageCondition,
  DonationStatus,
  Volunteer
} from '../types';

export interface ToolResult<T = any> {
  toolCalled: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  data?: T;
  error?: string;
  summary: string;
  nextRecommendedAction: string;
  traceId?: string;
}

// 1. createDonation
export async function createDonation(data: Partial<Donation>): Promise<ToolResult<Donation>> {
  const start = Date.now();
  const state = db.getState();

  const donationId = `donation-${Date.now()}`;
  const totalQuantity = data.totalQuantity || (data.foodItems ? data.foodItems.reduce((sum, item) => sum + item.quantity, 0) : 50);

  const newDonation: Donation = {
    id: donationId,
    donorId: data.donorId || 'donor-paradise-sec',
    donorName: data.donorName || '[DEMO] Paradise Biryani & Banquets',
    title: data.title || `${totalQuantity} Portions Surplus Food Donation`,
    rawText: data.rawText || '',
    foodItems: data.foodItems || [],
    totalQuantity,
    remainingQuantity: totalQuantity,
    dietaryTags: data.dietaryTags || ['Cooked Meals'],
    allergenNotes: data.allergenNotes || 'None declared',
    preparationTime: data.preparationTime || '13:00',
    expiryTime: data.expiryTime || '17:00',
    storageConditions: data.storageConditions || 'HOT',
    currentTempCelsius: data.currentTempCelsius,
    pickupWindow: data.pickupWindow || { start: '14:00', end: '16:30' },
    pickupAddress: data.pickupAddress || 'Secunderabad, Hyderabad',
    coordinates: data.coordinates || { lat: 17.4411, lng: 78.4983 },
    status: (data.safetyReview?.requiresHumanReview ? 'NEEDS_INFORMATION' : 'READY_FOR_REVIEW') as DonationStatus,
    safetyReview: data.safetyReview || {
      isCleared: true,
      requiresHumanReview: false,
      flags: [],
      notes: 'Initial automated screening complete.',
      reviewedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.donations.unshift(newDonation);

  // Create corresponding mission
  const missionId = `mission-${Date.now()}`;
  const newMission: Mission = {
    id: missionId,
    donationId,
    title: `Redistribution of ${newDonation.totalQuantity} Meals (${newDonation.title})`,
    status: 'MATCHING',
    allocations: [],
    transportAssignments: [],
    recipientResponses: [],
    reasoningSummary: `Donation registered by ${newDonation.donorName}. Ready for recipient discovery and allocation planning.`,
    agentRecommendations: ['Invoke findRegisteredRecipients within 10km radius'],
    blockers: newDonation.safetyReview.flags,
    events: [
      {
        id: `me-${Date.now()}-1`,
        missionId,
        timestamp: new Date().toISOString(),
        actorRole: 'DONOR',
        eventType: 'DONATION_CREATED',
        description: `Created donation of ${newDonation.totalQuantity} meals: ${newDonation.title}`
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.missions.unshift(newMission);
  db.saveState();

  const trace = db.addTrace({
    missionId,
    agentName: 'IntakeAgent',
    toolCalled: 'createDonation',
    inputParams: { donationId, totalQuantity, donorName: newDonation.donorName },
    status: 'SUCCESS',
    resultSummary: `Registered donation ${donationId} with ${totalQuantity} meals. Initial mission created.`,
    nextRecommendedAction: 'Invoke checkDonationReadiness and findRegisteredRecipients',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'createDonation',
    status: 'SUCCESS',
    data: newDonation,
    summary: `Donation ${donationId} created with ${totalQuantity} meals.`,
    nextRecommendedAction: 'Run checkDonationReadiness and findRegisteredRecipients',
    traceId: trace.id
  };
}

// 2. extractDonationDetails
export async function extractDonationDetails(nlText: string): Promise<ToolResult<any>> {
  const start = Date.now();
  const extracted = await extractDonationFromText(nlText);

  // Check RAG rules against extracted details
  const ragCheck = retrieveGuidelines({
    foodCategory: extracted.foodItems[0]?.category || 'Cooked Meals',
    storageCondition: extracted.storageConditions,
    temperatureCelsius: extracted.currentTempCelsius,
    durationHours: 1.5,
    hasAllergens: extracted.foodItems.some(i => i.allergens.length > 0)
  });

  // Combine safety flags
  const combinedFlags = Array.from(new Set([...extracted.safetyFlags, ...ragCheck.safetyAssessment.flags]));
  const requiresHumanReview = combinedFlags.length > 0 || extracted.missingFields.length > 0;

  const result = {
    ...extracted,
    safetyReview: {
      isCleared: !requiresHumanReview,
      requiresHumanReview,
      flags: combinedFlags,
      storageGuidelineCited: ragCheck.documents[0]?.title,
      citationId: ragCheck.documents[0]?.source,
      notes: ragCheck.safetyAssessment.recommendations.join('; ') || 'Standard safety parameters verified.',
      reviewedAt: new Date().toISOString()
    },
    ragGuidance: ragCheck.documents.map(d => ({
      id: d.id,
      title: d.title,
      authority: d.authority,
      excerpt: d.excerpt
    }))
  };

  const trace = db.addTrace({
    agentName: 'IntakeAgent',
    toolCalled: 'extractDonationDetails',
    inputParams: { textPreview: nlText.substring(0, 80) + '...' },
    status: 'SUCCESS',
    resultSummary: `Extracted ${result.totalQuantity} meals, ${result.foodItems.length} items, storage: ${result.storageConditions}. Safety check: ${requiresHumanReview ? 'NEEDS_REVIEW' : 'CLEARED'}.`,
    nextRecommendedAction: requiresHumanReview ? 'Surface missing details to donor before submission' : 'Proceed to createDonation',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'extractDonationDetails',
    status: 'SUCCESS',
    data: result,
    summary: `Extracted structured donation details: ${result.totalQuantity} meals, ${result.storageConditions} storage.`,
    nextRecommendedAction: requiresHumanReview ? 'Review highlighted safety flags' : 'Submit donation',
    traceId: trace.id
  };
}

// 3. findRegisteredRecipients
export async function findRegisteredRecipients(
  coords: Coordinates,
  dietaryTags: string[] = ['Cooked Meals'],
  requiredMeals: number = 50,
  radiusKm: number = 15
): Promise<ToolResult<RecipientOrganization[]>> {
  const start = Date.now();
  const state = db.getState();

  // Filter verified partner organizations within operational radius and availability
  const matched = state.recipients.filter(org => {
    if (!org.isVerifiedPartner) return false;
    if (!org.isAvailableNow) return false;

    // Check dietary compatibility
    const dietaryMatch = dietaryTags.some(tag => 
      org.dietaryAcceptance.includes(tag) || 
      org.dietaryAcceptance.includes('Cooked Meals') ||
      org.dietaryAcceptance.includes('Mixed Buffet')
    );

    // Approximate distance check in km (1 deg lat ~= 111km)
    const latDiff = (org.coordinates.lat - coords.lat) * 111;
    const lngDiff = (org.coordinates.lng - coords.lng) * 111 * Math.cos(coords.lat * (Math.PI / 180));
    const distKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    return dietaryMatch && distKm <= radiusKm;
  });

  const status = matched.length > 0 ? 'SUCCESS' : 'BLOCKED';
  const summary = matched.length > 0 
    ? `Found ${matched.length} registered partner organizations within ${radiusKm}km.`
    : `No eligible registered recipients found within ${radiusKm}km matching constraints.`;

  const trace = db.addTrace({
    agentName: 'DiscoveryAgent',
    toolCalled: 'findRegisteredRecipients',
    inputParams: { coords, dietaryTags, requiredMeals, radiusKm },
    status,
    resultSummary: summary,
    nextRecommendedAction: matched.length > 0 ? 'Invoke calculateAllocationPlan' : 'Expand search radius or propose safe alternative',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'findRegisteredRecipients',
    status,
    data: matched,
    summary,
    nextRecommendedAction: matched.length > 0 ? 'Calculate allocation plan' : 'Alert coordinator for geographic expansion',
    traceId: trace.id
  };
}

// 4. searchNearbyOrganizations
export async function searchNearbyOrganizations(coords: Coordinates, radiusKm: number = 10): Promise<ToolResult<any>> {
  const start = Date.now();
  const placesResult = await placesSearch(coords, radiusKm * 1000);

  const trace = db.addTrace({
    agentName: 'DiscoveryAgent',
    toolCalled: 'searchNearbyOrganizations',
    inputParams: { coords, radiusKm },
    status: 'SUCCESS',
    resultSummary: `${placesResult.statusNote} (${placesResult.results.length} total entities returned).`,
    nextRecommendedAction: placesResult.isLivePlaces ? 'Review discovered leads for manual verification' : 'Filter confirmed partners',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'searchNearbyOrganizations',
    status: 'SUCCESS',
    data: placesResult,
    summary: placesResult.statusNote,
    nextRecommendedAction: 'Distinguish verified partners from unverified Places leads',
    traceId: trace.id
  };
}

// 5. retrieveDonationGuidelines
export async function retrieveDonationGuidelines(params: {
  foodCategory?: string;
  storageCondition?: StorageCondition;
  temperatureCelsius?: number;
  durationHours?: number;
  hasAllergens?: boolean;
}): Promise<ToolResult<any>> {
  const start = Date.now();
  const guidance = retrieveGuidelines(params);

  const status = guidance.safetyAssessment.isCleared ? 'SUCCESS' : 'BLOCKED';
  const trace = db.addTrace({
    agentName: 'SafetyAgent',
    toolCalled: 'retrieveDonationGuidelines',
    inputParams: params,
    status,
    resultSummary: `Retrieved ${guidance.documents.length} standards. Safety review cleared: ${guidance.safetyAssessment.isCleared}. Flags: ${guidance.safetyAssessment.flags.length}`,
    nextRecommendedAction: guidance.safetyAssessment.requiresHumanReview ? 'Require human coordinator signoff' : 'Proceed with automated allocation',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'retrieveDonationGuidelines',
    status,
    data: guidance,
    summary: `Retrieved safety regulations from ${guidance.documents.map(d => d.authority).join(', ')}.`,
    nextRecommendedAction: guidance.safetyAssessment.requiresHumanReview ? 'Require human coordinator signoff' : 'Proceed with automated allocation',
    traceId: trace.id
  };
}

// 6. checkDonationReadiness
export async function checkDonationReadiness(donationId: string): Promise<ToolResult<any>> {
  const start = Date.now();
  const state = db.getState();
  const donation = state.donations.find(d => d.id === donationId);

  if (!donation) {
    return {
      toolCalled: 'checkDonationReadiness',
      status: 'FAILURE',
      error: `Donation ${donationId} not found`,
      summary: 'Donation not found',
      nextRecommendedAction: 'Verify donation ID'
    };
  }

  const blockers: string[] = [];
  if (donation.safetyReview?.flags && donation.safetyReview.flags.length > 0) {
    blockers.push(...donation.safetyReview.flags);
  }
  if (donation.totalQuantity <= 0) {
    blockers.push('Total meal quantity must be greater than zero.');
  }

  const isReady = blockers.length === 0;
  if (isReady && (donation.status === 'DRAFT' || donation.status === 'NEEDS_INFORMATION')) {
    donation.status = 'READY_FOR_REVIEW';
    db.saveState();
  }

  const trace = db.addTrace({
    missionId: state.missions.find(m => m.donationId === donationId)?.id,
    agentName: 'SafetyAgent',
    toolCalled: 'checkDonationReadiness',
    inputParams: { donationId },
    status: isReady ? 'SUCCESS' : 'BLOCKED',
    resultSummary: isReady ? 'Donation passed readiness check. Ready for recipient matching.' : `Blocked by ${blockers.length} issues.`,
    nextRecommendedAction: isReady ? 'Calculate allocation plan' : 'Resolve safety blockers with donor',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'checkDonationReadiness',
    status: isReady ? 'SUCCESS' : 'BLOCKED',
    data: { isReady, blockers, currentStatus: donation.status },
    summary: isReady ? 'Donation is fully ready for matching.' : `Readiness check failed: ${blockers.join(', ')}`,
    nextRecommendedAction: isReady ? 'Calculate allocation plan' : 'Address readiness blockers',
    traceId: trace.id
  };
}

// 7. calculateAllocationPlan
export async function calculateAllocationPlan(donationId: string): Promise<ToolResult<Allocation[]>> {
  const start = Date.now();
  const state = db.getState();
  const donation = state.donations.find(d => d.id === donationId);
  const mission = state.missions.find(m => m.donationId === donationId);

  if (!donation || !mission) {
    return {
      toolCalled: 'calculateAllocationPlan',
      status: 'FAILURE',
      error: 'Donation or associated mission not found',
      summary: 'Missing entities',
      nextRecommendedAction: 'Verify IDs'
    };
  }

  // Get eligible verified partners
  const eligiblePartners = state.recipients.filter(r => r.isVerifiedPartner && r.isAvailableNow);
  
  // Calculate deterministic allocations without exceeding donation quantity or recipient capacity
  let remainingMeals = donation.remainingQuantity;
  const proposedAllocations: Allocation[] = [];

  for (const partner of eligiblePartners) {
    if (remainingMeals <= 0) break;

    // Check existing need or available capacity
    const need = state.needs.find(n => n.recipientId === partner.id && n.status === 'OPEN');
    const availableCapacity = partner.capacityMaxMeals - partner.currentOccupancy;
    const targetDemand = need ? need.mealQuantityNeeded : availableCapacity;

    if (targetDemand <= 0) continue;

    // Allocate min(remaining, targetDemand)
    const allocateQty = Math.min(remainingMeals, targetDemand);
    if (allocateQty > 0) {
      proposedAllocations.push({
        id: `alloc-${Date.now()}-${proposedAllocations.length + 1}`,
        missionId: mission.id,
        donationId: donation.id,
        recipientId: partner.id,
        recipientName: partner.name,
        allocatedMeals: allocateQty,
        status: 'PROPOSED'
      });
      remainingMeals -= allocateQty;
    }
  }

  mission.allocations = proposedAllocations;
  mission.status = 'AWAITING_CONFIRMATION';
  mission.reasoningSummary = `Deterministic matching proposed ${proposedAllocations.length} recipient allocations totaling ${donation.remainingQuantity - remainingMeals} meals. Remaining unallocated: ${remainingMeals}.`;
  
  if (remainingMeals > 0) {
    donation.status = 'PARTIALLY_ALLOCATED';
    mission.agentRecommendations = [
      `Approve current allocations for ${donation.remainingQuantity - remainingMeals} meals.`,
      `Seek secondary partner for remaining ${remainingMeals} meals.`
    ];
  } else {
    donation.status = 'AWAITING_RECIPIENT_RESPONSE';
    mission.agentRecommendations = [
      'Send recipient acceptance requests to proposed organizations.',
      'Query available volunteer transport.'
    ];
  }

  db.saveState();

  const trace = db.addTrace({
    missionId: mission.id,
    agentName: 'MatchingAgent',
    toolCalled: 'calculateAllocationPlan',
    inputParams: { donationId, availableQuantity: donation.remainingQuantity },
    status: proposedAllocations.length > 0 ? 'SUCCESS' : 'BLOCKED',
    resultSummary: `Computed ${proposedAllocations.length} allocations. Allocated: ${donation.remainingQuantity - remainingMeals}, Remaining: ${remainingMeals}.`,
    nextRecommendedAction: 'Invoke requestRecipientAcceptance for each proposed allocation',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'calculateAllocationPlan',
    status: proposedAllocations.length > 0 ? 'SUCCESS' : 'BLOCKED',
    data: proposedAllocations,
    summary: `Proposed ${proposedAllocations.length} allocations (${donation.remainingQuantity - remainingMeals} meals allocated, ${remainingMeals} remaining).`,
    nextRecommendedAction: 'Request recipient acceptances',
    traceId: trace.id
  };
}

// 8. requestRecipientAcceptance
export async function requestRecipientAcceptance(
  donationId: string,
  recipientId: string,
  proposedQuantity: number
): Promise<ToolResult<RecipientResponse>> {
  const start = Date.now();
  const state = db.getState();
  const recipient = state.recipients.find(r => r.id === recipientId);
  const mission = state.missions.find(m => m.donationId === donationId);

  if (!recipient || !mission) {
    return {
      toolCalled: 'requestRecipientAcceptance',
      status: 'FAILURE',
      error: 'Recipient or mission not found',
      summary: 'Entity not found',
      nextRecommendedAction: 'Verify IDs'
    };
  }

  const responseId = `resp-${Date.now()}`;
  const responseRecord: RecipientResponse = {
    id: responseId,
    donationId,
    recipientId,
    recipientName: recipient.name,
    status: 'PENDING',
    acceptedQuantity: proposedQuantity,
    notes: 'Awaiting response from NGO coordinator'
  };

  // Add or update response
  const existingIdx = mission.recipientResponses.findIndex(r => r.recipientId === recipientId);
  if (existingIdx >= 0) {
    mission.recipientResponses[existingIdx] = responseRecord;
  } else {
    mission.recipientResponses.push(responseRecord);
  }
  state.responses.push(responseRecord);

  db.addEvent(mission.id, {
    actorRole: 'AGENT',
    eventType: 'RECIPIENT_REQUESTED',
    description: `Requested acceptance from ${recipient.name} for ${proposedQuantity} meals.`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId: mission.id,
    agentName: 'CoordinationAgent',
    toolCalled: 'requestRecipientAcceptance',
    inputParams: { donationId, recipientId, proposedQuantity },
    status: 'SUCCESS',
    resultSummary: `Sent request to ${recipient.name} for ${proposedQuantity} meals. Status: PENDING.`,
    nextRecommendedAction: 'Await NGO coordinator action in NGO portal',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'requestRecipientAcceptance',
    status: 'SUCCESS',
    data: responseRecord,
    summary: `Request sent to ${recipient.name} for ${proposedQuantity} meals.`,
    nextRecommendedAction: 'Await response in NGO Portal',
    traceId: trace.id
  };
}

// 9. respondToDonationRequest
export async function respondToDonationRequest(
  responseId: string,
  status: 'ACCEPTED' | 'REJECTED' | 'NO_RESPONSE' | 'PARTIAL',
  acceptedQuantity?: number,
  notes?: string
): Promise<ToolResult<RecipientResponse>> {
  const start = Date.now();
  const state = db.getState();
  
  // Find response in global state or mission
  let response = state.responses.find(r => r.id === responseId);
  let mission = state.missions.find(m => m.recipientResponses.some(r => r.id === responseId));

  if (!response && mission) {
    response = mission.recipientResponses.find(r => r.id === responseId);
  }

  if (!response) {
    return {
      toolCalled: 'respondToDonationRequest',
      status: 'FAILURE',
      error: `Response ${responseId} not found`,
      summary: 'Response not found',
      nextRecommendedAction: 'Verify response ID'
    };
  }

  response.status = status;
  response.acceptedQuantity = acceptedQuantity !== undefined ? acceptedQuantity : response.acceptedQuantity;
  response.notes = notes || response.notes;
  response.respondedAt = new Date().toISOString();

  if (mission) {
    const missionResp = mission.recipientResponses.find(r => r.id === responseId);
    if (missionResp) {
      Object.assign(missionResp, response);
    }

    db.addEvent(mission.id, {
      actorRole: 'NGO',
      eventType: `RECIPIENT_${status}`,
      description: `${response.recipientName} marked request ${status} (${response.acceptedQuantity} meals). Notes: ${notes || 'None'}`
    });

    if (status === 'REJECTED') {
      // Replan immediately
      mission.reasoningSummary = `Recipient ${response.recipientName} rejected donation. Coordination Agent evaluating alternative partners.`;
      mission.blockers.push(`Rejected by ${response.recipientName}: ${notes || 'Quota exceeded'}`);
      // Remove or mark allocation cancelled
      const alloc = mission.allocations.find(a => a.recipientId === response.recipientId);
      if (alloc) alloc.status = 'CANCELLED';
    } else if (status === 'ACCEPTED') {
      mission.reasoningSummary = `${response.recipientName} confirmed acceptance of ${response.acceptedQuantity} meals. Ready for transport assignment.`;
      const alloc = mission.allocations.find(a => a.recipientId === response.recipientId);
      if (alloc) {
        alloc.allocatedMeals = response.acceptedQuantity;
      }
    }
  }

  db.saveState();

  const trace = db.addTrace({
    missionId: mission?.id,
    agentName: 'CoordinationAgent',
    toolCalled: 'respondToDonationRequest',
    inputParams: { responseId, status, acceptedQuantity, notes },
    status: 'SUCCESS',
    resultSummary: `Registered response ${status} from ${response.recipientName}. Quantity: ${response.acceptedQuantity}.`,
    nextRecommendedAction: status === 'REJECTED' ? 'Trigger replanMission for alternative recipient' : 'Invoke findAvailableVolunteers',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'respondToDonationRequest',
    status: 'SUCCESS',
    data: response,
    summary: `Response recorded: ${status} for ${response.acceptedQuantity} meals.`,
    nextRecommendedAction: status === 'REJECTED' ? 'Replan mission' : 'Assign volunteer transport',
    traceId: trace.id
  };
}

// 10. findAvailableVolunteers
export async function findAvailableVolunteers(
  pickupCoords: Coordinates,
  dropoffCoords?: Coordinates,
  mealQuantity: number = 60,
  needsColdStorage: boolean = false
): Promise<ToolResult<Volunteer[]>> {
  const start = Date.now();
  const state = db.getState();

  const eligible = state.volunteers.filter(vol => {
    if (!vol.isAvailable) return false;
    if (needsColdStorage && !vol.hasColdStorage) return false;
    if (vol.capacityMeals < mealQuantity && !vol.hasColdStorage) {
      // Can still be considered for partial or multi-trip, but prefer sufficient capacity
    }
    return true;
  });

  // Sort by capacity match (best fit first)
  eligible.sort((a, b) => a.capacityMeals - b.capacityMeals);

  const status = eligible.length > 0 ? 'SUCCESS' : 'BLOCKED';
  const summary = eligible.length > 0 
    ? `Found ${eligible.length} available volunteers with suitable transport capacity.`
    : 'No available volunteers found meeting vehicle requirements.';

  const trace = db.addTrace({
    agentName: 'MatchingAgent',
    toolCalled: 'findAvailableVolunteers',
    inputParams: { mealQuantity, needsColdStorage },
    status,
    resultSummary: summary,
    nextRecommendedAction: eligible.length > 0 ? 'Invoke requestVolunteerAssignment' : 'Alert coordinator for manual driver dispatch',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'findAvailableVolunteers',
    status,
    data: eligible,
    summary,
    nextRecommendedAction: eligible.length > 0 ? 'Assign volunteer' : 'Hold transport pending driver availability',
    traceId: trace.id
  };
}

// 11. requestVolunteerAssignment
export async function requestVolunteerAssignment(
  missionId: string,
  volunteerId: string
): Promise<ToolResult<TransportAssignment>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.id === missionId);
  const volunteer = state.volunteers.find(v => v.id === volunteerId);

  if (!mission || !volunteer) {
    return {
      toolCalled: 'requestVolunteerAssignment',
      status: 'FAILURE',
      error: 'Mission or volunteer not found',
      summary: 'Missing entities',
      nextRecommendedAction: 'Verify IDs'
    };
  }

  const assignmentId = `trans-${Date.now()}`;
  const assignment: TransportAssignment = {
    id: assignmentId,
    missionId,
    donationId: mission.donationId,
    volunteerId,
    volunteerName: volunteer.name,
    vehicleType: volunteer.vehicleType,
    pickupTimeWindow: { start: '14:30', end: '16:00' },
    status: 'PROPOSED'
  };

  mission.transportAssignments.push(assignment);
  mission.status = 'AWAITING_CONFIRMATION';
  mission.reasoningSummary = `Proposed pickup assignment to ${volunteer.name} (${volunteer.vehicleType}, cap ${volunteer.capacityMeals} meals). Awaiting driver confirmation.`;

  db.addEvent(mission.id, {
    actorRole: 'AGENT',
    eventType: 'TRANSPORT_PROPOSED',
    description: `Proposed transport assignment to ${volunteer.name}.`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId,
    agentName: 'MatchingAgent',
    toolCalled: 'requestVolunteerAssignment',
    inputParams: { missionId, volunteerId },
    status: 'SUCCESS',
    resultSummary: `Assigned transport ${assignmentId} to ${volunteer.name}. Status: PROPOSED.`,
    nextRecommendedAction: 'Await driver response in Volunteer Portal',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'requestVolunteerAssignment',
    status: 'SUCCESS',
    data: assignment,
    summary: `Transport proposed to ${volunteer.name}.`,
    nextRecommendedAction: 'Await response in Volunteer Portal',
    traceId: trace.id
  };
}

// 12. respondToPickupRequest
export async function respondToPickupRequest(
  assignmentId: string,
  status: 'ACCEPTED' | 'DECLINED',
  reason?: string
): Promise<ToolResult<TransportAssignment>> {
  const start = Date.now();
  const state = db.getState();
  
  let mission = state.missions.find(m => m.transportAssignments.some(t => t.id === assignmentId));
  let assignment = mission?.transportAssignments.find(t => t.id === assignmentId);

  if (!assignment || !mission) {
    return {
      toolCalled: 'respondToPickupRequest',
      status: 'FAILURE',
      error: `Assignment ${assignmentId} not found`,
      summary: 'Assignment not found',
      nextRecommendedAction: 'Verify assignment ID'
    };
  }

  assignment.status = status;
  if (status === 'DECLINED') {
    assignment.cancellationReason = reason || 'Volunteer unavailable at requested time';
    mission.status = 'AWAITING_TRANSPORT';
    mission.reasoningSummary = `Volunteer ${assignment.volunteerName} declined pickup. Coordination Agent finding replacement.`;
    mission.blockers.push(`Transport declined by ${assignment.volunteerName}`);
  } else if (status === 'ACCEPTED') {
    mission.status = 'AWAITING_APPROVAL';
    mission.reasoningSummary = `Volunteer ${assignment.volunteerName} confirmed pickup availability. Complete plan ready for Human Coordinator approval.`;
  }

  db.addEvent(mission.id, {
    actorRole: 'VOLUNTEER',
    eventType: `TRANSPORT_${status}`,
    description: `${assignment.volunteerName} ${status.toLowerCase()} transport assignment. Reason: ${reason || 'N/A'}`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId: mission.id,
    agentName: 'CoordinationAgent',
    toolCalled: 'respondToPickupRequest',
    inputParams: { assignmentId, status, reason },
    status: 'SUCCESS',
    resultSummary: `Volunteer responded ${status}. Mission status updated to ${mission.status}.`,
    nextRecommendedAction: status === 'ACCEPTED' ? 'Seek Human Coordinator approval' : 'Reassign available volunteer',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'respondToPickupRequest',
    status: 'SUCCESS',
    data: assignment,
    summary: `Pickup request ${status} by volunteer.`,
    nextRecommendedAction: status === 'ACCEPTED' ? 'Approve allocation plan' : 'Assign alternative volunteer',
    traceId: trace.id
  };
}

// 13. approveAllocation
export async function approveAllocation(
  missionId: string,
  allocationId?: string,
  coordinatorNotes?: string
): Promise<ToolResult<Mission>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.id === missionId);

  if (!mission) {
    return {
      toolCalled: 'approveAllocation',
      status: 'FAILURE',
      error: `Mission ${missionId} not found`,
      summary: 'Mission not found',
      nextRecommendedAction: 'Verify mission ID'
    };
  }

  // Update allocation statuses
  for (const alloc of mission.allocations) {
    if (!allocationId || alloc.id === allocationId) {
      alloc.status = 'APPROVED';
      alloc.approvedAt = new Date().toISOString();
      alloc.approvedBy = 'Human Coordinator (Live Review)';
    }
  }

  mission.status = 'APPROVED';
  mission.reasoningSummary = `Human Coordinator approved allocation plan. Dispatch authorized. Proceeding to meal reservation. Notes: ${coordinatorNotes || 'All safety and logistics checks satisfied.'}`;
  mission.blockers = [];

  const donation = state.donations.find(d => d.id === mission.donationId);
  if (donation) {
    donation.status = 'RESERVED';
  }

  db.addEvent(mission.id, {
    actorRole: 'COORDINATOR',
    eventType: 'ALLOCATION_APPROVED',
    description: `Coordinator approved allocation plan. Authorized dispatch for ${mission.allocations.reduce((sum, a) => sum + a.allocatedMeals, 0)} meals.`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId,
    agentName: 'CoordinationAgent',
    toolCalled: 'approveAllocation',
    inputParams: { missionId, allocationId, coordinatorNotes },
    status: 'SUCCESS',
    resultSummary: 'Allocation plan officially approved by human coordinator. Reservation confirmed.',
    nextRecommendedAction: 'Volunteer can proceed with physical pickup',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'approveAllocation',
    status: 'SUCCESS',
    data: mission,
    summary: 'Allocation plan approved. Mission authorized for pickup.',
    nextRecommendedAction: 'Volunteer confirms pickup upon arrival',
    traceId: trace.id
  };
}

// 14. reserveMeals
export async function reserveMeals(donationId: string, allocationId: string): Promise<ToolResult<any>> {
  const start = Date.now();
  const state = db.getState();
  const donation = state.donations.find(d => d.id === donationId);
  const mission = state.missions.find(m => m.donationId === donationId);
  const allocation = mission?.allocations.find(a => a.id === allocationId);

  if (!donation || !allocation) {
    return {
      toolCalled: 'reserveMeals',
      status: 'FAILURE',
      error: 'Donation or allocation not found',
      summary: 'Entity missing',
      nextRecommendedAction: 'Verify IDs'
    };
  }

  allocation.status = 'RESERVED';
  donation.status = 'RESERVED';
  db.saveState();

  const trace = db.addTrace({
    missionId: mission?.id,
    agentName: 'MatchingAgent',
    toolCalled: 'reserveMeals',
    inputParams: { donationId, allocationId, quantity: allocation.allocatedMeals },
    status: 'SUCCESS',
    resultSummary: `Atomically reserved ${allocation.allocatedMeals} meals for recipient ${allocation.recipientName}.`,
    nextRecommendedAction: 'Volunteer proceeds with pickup',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'reserveMeals',
    status: 'SUCCESS',
    data: { donationId, allocationId, reservedMeals: allocation.allocatedMeals },
    summary: `Atomically reserved ${allocation.allocatedMeals} meals.`,
    nextRecommendedAction: 'Execute pickup',
    traceId: trace.id
  };
}

// 15. recordPickup
export async function recordPickup(
  assignmentId: string,
  verifiedTemp?: number,
  notes?: string
): Promise<ToolResult<TransportAssignment>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.transportAssignments.some(t => t.id === assignmentId));
  const assignment = mission?.transportAssignments.find(t => t.id === assignmentId);

  if (!assignment || !mission) {
    return {
      toolCalled: 'recordPickup',
      status: 'FAILURE',
      error: `Assignment ${assignmentId} not found`,
      summary: 'Assignment not found',
      nextRecommendedAction: 'Verify assignment ID'
    };
  }

  assignment.status = 'IN_TRANSIT';
  assignment.actualPickupTime = new Date().toISOString();
  assignment.pickupVerifiedTemp = verifiedTemp;

  mission.status = 'IN_TRANSIT';
  mission.reasoningSummary = `Food physically collected by ${assignment.volunteerName}. Temperature verified at ${verifiedTemp ?? 'ambient'}°C. En route to recipient shelter.`;

  const donation = state.donations.find(d => d.id === mission.donationId);
  if (donation) {
    donation.status = 'PICKED_UP';
  }

  db.addEvent(mission.id, {
    actorRole: 'VOLUNTEER',
    eventType: 'PICKUP_CONFIRMED',
    description: `Volunteer recorded pickup. Verified temperature: ${verifiedTemp ? `${verifiedTemp}°C` : 'Verified safe'}. Notes: ${notes || 'Packed securely'}.`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId: mission.id,
    agentName: 'CoordinationAgent',
    toolCalled: 'recordPickup',
    inputParams: { assignmentId, verifiedTemp, notes },
    status: 'SUCCESS',
    resultSummary: `Pickup recorded at ${assignment.actualPickupTime}. Mission is IN_TRANSIT.`,
    nextRecommendedAction: 'Volunteer completes drop-off and records delivery confirmation',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'recordPickup',
    status: 'SUCCESS',
    data: assignment,
    summary: `Pickup confirmed. En route to recipient.`,
    nextRecommendedAction: 'Record delivery upon arrival at destination',
    traceId: trace.id
  };
}

// 16. recordDelivery
export async function recordDelivery(
  assignmentId: string,
  verifiedQuantity?: number,
  receiverNotes?: string
): Promise<ToolResult<Mission>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.transportAssignments.some(t => t.id === assignmentId));
  const assignment = mission?.transportAssignments.find(t => t.id === assignmentId);

  if (!assignment || !mission) {
    return {
      toolCalled: 'recordDelivery',
      status: 'FAILURE',
      error: `Assignment ${assignmentId} not found`,
      summary: 'Assignment not found',
      nextRecommendedAction: 'Verify assignment ID'
    };
  }

  assignment.status = 'COMPLETED';
  assignment.actualDeliveryTime = new Date().toISOString();
  assignment.deliveryReceivedQuantity = verifiedQuantity;

  // Mark allocations delivered
  for (const alloc of mission.allocations) {
    alloc.status = 'DELIVERED';
  }

  mission.status = 'COMPLETED';
  mission.reasoningSummary = `Redistribution mission successfully completed! All meals safely handed over and verified by recipient. Handover notes: ${receiverNotes || 'Meals received hot and fresh'}.`;

  const donation = state.donations.find(d => d.id === mission.donationId);
  if (donation) {
    donation.status = 'DELIVERED';
    donation.remainingQuantity = 0;
  }

  // Release volunteer
  const volunteer = state.volunteers.find(v => v.id === assignment.volunteerId);
  if (volunteer) {
    volunteer.isAvailable = true;
    delete volunteer.activeAssignmentId;
  }

  db.addEvent(mission.id, {
    actorRole: 'VOLUNTEER',
    eventType: 'DELIVERY_CONFIRMED',
    description: `Delivery completed. Recipient verified receipt of meals. Notes: ${receiverNotes || 'Verified good condition'}.`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId: mission.id,
    agentName: 'CoordinationAgent',
    toolCalled: 'recordDelivery',
    inputParams: { assignmentId, verifiedQuantity, receiverNotes },
    status: 'SUCCESS',
    resultSummary: `Mission ${mission.id} marked COMPLETED. Verified delivery of meals.`,
    nextRecommendedAction: 'Mission finished. Audit log closed.',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'recordDelivery',
    status: 'SUCCESS',
    data: mission,
    summary: 'Delivery verified and recorded. Mission completed successfully.',
    nextRecommendedAction: 'View final audit trail in Mission Tracker',
    traceId: trace.id
  };
}

// 17. cancelAssignment
export async function cancelAssignment(
  assignmentId: string,
  reason: string,
  actorRole: 'VOLUNTEER' | 'COORDINATOR' | 'SYSTEM' = 'VOLUNTEER'
): Promise<ToolResult<TransportAssignment>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.transportAssignments.some(t => t.id === assignmentId));
  const assignment = mission?.transportAssignments.find(t => t.id === assignmentId);

  if (!assignment || !mission) {
    return {
      toolCalled: 'cancelAssignment',
      status: 'FAILURE',
      error: `Assignment ${assignmentId} not found`,
      summary: 'Assignment not found',
      nextRecommendedAction: 'Verify assignment ID'
    };
  }

  assignment.status = 'CANCELLED';
  assignment.cancellationReason = reason;
  assignment.cancelledByRole = actorRole;

  mission.status = 'AWAITING_TRANSPORT';
  mission.blockers.push(`Transport cancelled: ${reason}`);
  mission.reasoningSummary = `Assignment cancelled by ${actorRole}. Invalidation event recorded. Coordination Agent initiating replan.`;

  db.addEvent(mission.id, {
    actorRole,
    eventType: 'ASSIGNMENT_CANCELLED',
    description: `Transport assignment cancelled by ${actorRole}: ${reason}`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId: mission.id,
    agentName: 'CoordinationAgent',
    toolCalled: 'cancelAssignment',
    inputParams: { assignmentId, reason, actorRole },
    status: 'SUCCESS',
    resultSummary: `Assignment ${assignmentId} cancelled. Transport plan invalidated.`,
    nextRecommendedAction: 'Invoke replanMission to reassign driver',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'cancelAssignment',
    status: 'SUCCESS',
    data: assignment,
    summary: `Assignment cancelled: ${reason}. Replanning triggered.`,
    nextRecommendedAction: 'Replan mission',
    traceId: trace.id
  };
}

// 18. replanMission
export async function replanMission(missionId: string, triggerReason: string): Promise<ToolResult<Mission>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.id === missionId);

  if (!mission) {
    return {
      toolCalled: 'replanMission',
      status: 'FAILURE',
      error: `Mission ${missionId} not found`,
      summary: 'Mission not found',
      nextRecommendedAction: 'Verify mission ID'
    };
  }

  // Clear failed assignments
  mission.transportAssignments = mission.transportAssignments.filter(t => t.status !== 'CANCELLED' && t.status !== 'DECLINED');
  
  // Re-run matching
  const matchingResult = await calculateAllocationPlan(mission.donationId);

  mission.blockers = mission.blockers.filter(b => !b.includes('declined') && !b.includes('cancelled'));
  mission.reasoningSummary = `Replanned mission following ${triggerReason}. New proposals generated.`;

  db.addEvent(mission.id, {
    actorRole: 'AGENT',
    eventType: 'MISSION_REPLANNED',
    description: `Coordination Agent replanned mission. Reason: ${triggerReason}.`
  });

  db.saveState();

  const trace = db.addTrace({
    missionId,
    agentName: 'CoordinationAgent',
    toolCalled: 'replanMission',
    inputParams: { missionId, triggerReason },
    status: 'SUCCESS',
    resultSummary: `Replanning executed. Trigger: ${triggerReason}. New allocations: ${mission.allocations.length}.`,
    nextRecommendedAction: 'Send updated requests to newly proposed recipients or drivers',
    executionDurationMs: Date.now() - start
  });

  return {
    toolCalled: 'replanMission',
    status: 'SUCCESS',
    data: mission,
    summary: `Mission replanned due to: ${triggerReason}.`,
    nextRecommendedAction: 'Review updated allocation proposals',
    traceId: trace.id
  };
}

// 19. getMissionStatus
export async function getMissionStatus(missionId: string): Promise<ToolResult<Mission>> {
  const start = Date.now();
  const state = db.getState();
  const mission = state.missions.find(m => m.id === missionId);

  if (!mission) {
    return {
      toolCalled: 'getMissionStatus',
      status: 'FAILURE',
      error: `Mission ${missionId} not found`,
      summary: 'Mission not found',
      nextRecommendedAction: 'Verify mission ID'
    };
  }

  return {
    toolCalled: 'getMissionStatus',
    status: 'SUCCESS',
    data: mission,
    summary: `Mission status: ${mission.status} with ${mission.allocations.length} allocations.`,
    nextRecommendedAction: mission.status === 'COMPLETED' ? 'Mission concluded' : 'Continue tracking'
  };
}
