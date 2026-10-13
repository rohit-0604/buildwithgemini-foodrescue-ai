import { NextResponse } from 'next/server';
import { approveAllocation } from '@/lib/tools';

export async function POST(req: Request) {
  try {
    const { missionId, allocationId, notes } = await req.json();
    if (!missionId) {
      return NextResponse.json({ success: false, error: 'missionId is required' }, { status: 400 });
    }
    const result = await approveAllocation(missionId, allocationId, notes);
    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
