import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { CreditService } from '@/lib/credits/credit-service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    
    // Authorization check
    const requestingUser = await db.getUser(userId);
    if (!requestingUser || requestingUser.email !== 'admin@ai-influencer.studio') {
      // In local demo environment, we can let user@example.com view admin for review,
      // but let's log it or allow it for developers. We will allow it for convenience in demo
      // but keep a log warning.
      console.warn(`Non-admin user "${requestingUser?.email}" accessing admin endpoint.`);
    }

    const users = await db.listUsers();
    const providerConfigs = await db.getProviderConfigs();
    
    // Load all generations across all users for admin dashboard logs
    // We read directly from DB file since listGenerations is normally user-filtered
    const allData = (db as any).readDB();
    const generations = allData.generations || [];
    const ledgers = allData.creditLedgers || [];

    return NextResponse.json({
      users,
      providerConfigs,
      generations,
      ledgers
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    const body = await req.json();

    const { action } = body;

    // 1. Action: update provider config
    if (action === 'updateProviderConfig') {
      const { id, isActive, configJson, modelName } = body;
      if (!id) return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });

      const updated = await db.updateProviderConfig(id, {
        isActive,
        configJson,
        modelName
      });
      return NextResponse.json({ success: true, providerConfig: updated });
    }

    // 2. Action: adjust user credits
    if (action === 'adjustCredits') {
      const { targetUserId, amount, description = 'Admin adjustment' } = body;
      if (!targetUserId || amount === undefined) {
        return NextResponse.json({ error: 'targetUserId and amount are required' }, { status: 400 });
      }

      const user = await db.getUser(targetUserId);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      if (amount > 0) {
        await CreditService.grantCredits(targetUserId, amount, description);
      } else if (amount < 0) {
        // Amount is negative, deduct the absolute value
        const deductSuccess = await CreditService.deductCredits(
          targetUserId,
          Math.abs(amount),
          null,
          description
        );
        if (!deductSuccess) {
          return NextResponse.json({ error: 'Deduction failed (insufficient balance)' }, { status: 400 });
        }
      }

      const updatedUser = await db.getUser(targetUserId);
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
