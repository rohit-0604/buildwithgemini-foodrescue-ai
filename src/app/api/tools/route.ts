import { NextResponse } from 'next/server';
import * as tools from '@/lib/tools';

export async function POST(req: Request) {
  try {
    const { toolName, args } = await req.json();

    if (!toolName) {
      return NextResponse.json({ success: false, error: 'toolName is required' }, { status: 400 });
    }

    let result: tools.ToolResult;

    switch (toolName) {
      case 'createDonation':
        result = await tools.createDonation(args);
        break;
      case 'extractDonationDetails':
        result = await tools.extractDonationDetails(args.text);
        break;
      case 'findRegisteredRecipients':
        result = await tools.findRegisteredRecipients(args.coords, args.dietaryTags, args.requiredMeals, args.radiusKm);
        break;
      case 'searchNearbyOrganizations':
        result = await tools.searchNearbyOrganizations(args.coords, args.radiusKm);
        break;
      case 'retrieveDonationGuidelines':
        result = await tools.retrieveDonationGuidelines(args);
        break;
      case 'checkDonationReadiness':
        result = await tools.checkDonationReadiness(args.donationId);
        break;
      case 'calculateAllocationPlan':
        result = await tools.calculateAllocationPlan(args.donationId);
        break;
      case 'requestRecipientAcceptance':
        result = await tools.requestRecipientAcceptance(args.donationId, args.recipientId, args.proposedQuantity);
        break;
      case 'respondToDonationRequest':
        result = await tools.respondToDonationRequest(args.responseId, args.status, args.acceptedQuantity, args.notes);
        break;
      case 'findAvailableVolunteers':
        result = await tools.findAvailableVolunteers(args.pickupCoords, args.dropoffCoords, args.mealQuantity, args.needsColdStorage);
        break;
      case 'requestVolunteerAssignment':
        result = await tools.requestVolunteerAssignment(args.missionId, args.volunteerId);
        break;
      case 'respondToPickupRequest':
        result = await tools.respondToPickupRequest(args.assignmentId, args.status, args.reason);
        break;
      case 'approveAllocation':
        result = await tools.approveAllocation(args.missionId, args.allocationId, args.coordinatorNotes);
        break;
      case 'reserveMeals':
        result = await tools.reserveMeals(args.donationId, args.allocationId);
        break;
      case 'recordPickup':
        result = await tools.recordPickup(args.assignmentId, args.verifiedTemp, args.notes);
        break;
      case 'recordDelivery':
        result = await tools.recordDelivery(args.assignmentId, args.verifiedQuantity, args.receiverNotes);
        break;
      case 'cancelAssignment':
        result = await tools.cancelAssignment(args.assignmentId, args.reason, args.actorRole);
        break;
      case 'replanMission':
        result = await tools.replanMission(args.missionId, args.triggerReason);
        break;
      case 'getMissionStatus':
        result = await tools.getMissionStatus(args.missionId);
        break;
      default:
        return NextResponse.json({ success: false, error: `Unknown tool: ${toolName}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
