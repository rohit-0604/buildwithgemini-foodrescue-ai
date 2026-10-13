import { NextResponse } from 'next/server';
import { extractDonationDetails } from '@/lib/tools';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || '';
    if (!text.trim()) {
      return NextResponse.json({ success: false, error: 'Text prompt is required' }, { status: 400 });
    }
    const result = await extractDonationDetails(text);
    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
