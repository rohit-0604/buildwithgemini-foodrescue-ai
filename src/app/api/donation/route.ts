import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDonation } from '@/lib/tools';
import { runOrchestrationCycle } from '@/lib/orchestrator';

export async function GET() {
  const state = db.getState();
  return NextResponse.json({ success: true, data: state.donations });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createDonation(body);
    if (result.status === 'SUCCESS' && result.data) {
      // Auto-trigger orchestration cycle in background/response
      try {
        await runOrchestrationCycle(result.data.id);
      } catch (e) {
        console.warn('Orchestration cycle warning:', e);
      }
    }
    return NextResponse.json({ success: true, data: result.data, summary: result.summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
