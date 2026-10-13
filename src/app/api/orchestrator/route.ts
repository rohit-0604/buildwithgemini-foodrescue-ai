import { NextResponse } from 'next/server';
import { runOrchestrationCycle } from '@/lib/orchestrator';

export async function POST(req: Request) {
  try {
    const { donationId } = await req.json();
    if (!donationId) {
      return NextResponse.json({ success: false, error: 'donationId is required' }, { status: 400 });
    }
    const result = await runOrchestrationCycle(donationId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
