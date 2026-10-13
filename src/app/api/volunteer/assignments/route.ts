import { NextResponse } from 'next/server';
import { respondToPickupRequest, recordPickup, recordDelivery, cancelAssignment } from '@/lib/tools';

export async function POST(req: Request) {
  try {
    const { action, assignmentId, status, reason, verifiedTemp, verifiedQuantity, notes } = await req.json();
    if (!action || !assignmentId) {
      return NextResponse.json({ success: false, error: 'action and assignmentId are required' }, { status: 400 });
    }

    let result;
    if (action === 'respond') {
      result = await respondToPickupRequest(assignmentId, status, reason);
    } else if (action === 'pickup') {
      result = await recordPickup(assignmentId, verifiedTemp, notes);
    } else if (action === 'delivery') {
      result = await recordDelivery(assignmentId, verifiedQuantity, notes);
    } else if (action === 'cancel') {
      result = await cancelAssignment(assignmentId, reason || 'Cancelled by volunteer', 'VOLUNTEER');
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
