import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    const user = await db.getUser(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
