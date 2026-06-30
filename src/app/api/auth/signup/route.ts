import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const userId = `usr_${Math.random().toString(36).substring(2, 11)}`;
    const newUser = await db.createUser({
      id: userId,
      email,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      plan: 'free',
      creditBalance: 100
    });

    // Create default project for this user
    await db.createProject({
      id: `proj_${Math.random().toString(36).substring(2, 11)}`,
      userId,
      name: 'My Workspace',
      description: 'Your default workspace for AI characters'
    });

    // Log the welcome credit ledger entry
    await db.createLedgerEntry({
      userId,
      action: 'grant',
      amount: 100,
      generationId: null,
      description: 'Welcome credit grant'
    });

    const response = NextResponse.json({ user: newUser });
    
    // Set cookie
    response.cookies.set('userId', userId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
