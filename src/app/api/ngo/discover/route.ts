import { NextResponse } from 'next/server';
import { searchNearbyOrganizations } from '@/lib/tools';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '17.4411');
    const lng = parseFloat(url.searchParams.get('lng') || '78.4983');
    const radius = parseFloat(url.searchParams.get('radius') || '10');

    const result = await searchNearbyOrganizations({ lat, lng }, radius);
    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
