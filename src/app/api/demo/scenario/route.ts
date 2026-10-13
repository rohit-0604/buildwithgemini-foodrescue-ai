import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { scenarioId } = await req.json();
    if (!scenarioId) {
      return NextResponse.json({ success: false, error: 'scenarioId is required' }, { status: 400 });
    }
    const result = db.loadScenario(scenarioId);
    return NextResponse.json({
      success: true,
      scenario: result,
      state: db.getState()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
