import { NextResponse } from 'next/server';
import { retrieveGuidelines, KNOWLEDGE_BASE } from '@/lib/rag';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: KNOWLEDGE_BASE
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = retrieveGuidelines(body);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
