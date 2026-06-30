import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found. Try signing up.' }, { status: 404 });
    }

    const response = NextResponse.json({ user });
    
    // Set userId cookie for session tracking (lasts 7 days)
    response.cookies.set('userId', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false, // Accessible by client side for convenience
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
