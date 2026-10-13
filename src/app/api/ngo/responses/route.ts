import { NextResponse } from 'next/server';
import { respondToDonationRequest } from '@/lib/tools';

export async function POST(req: Request) {
  try {
    const { responseId, status, acceptedQuantity, notes } = await req.json();
    if (!responseId || !status) {
      return NextResponse.json({ success: false, error: 'responseId and status are required' }, { status: 400 });
    }
    const result = await respondToDonationRequest(responseId, status, acceptedQuantity, notes);
    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
