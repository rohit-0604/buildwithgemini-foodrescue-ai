import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const newState = db.reset();
    return NextResponse.json({
      success: true,
      message: 'Demo database successfully reset to clean initial state.',
      data: newState
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
