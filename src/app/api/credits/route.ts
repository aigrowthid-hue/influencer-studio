import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/json-db';
import { CreditService } from '@/lib/credits/credit-service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    const user = await db.getUser(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ledger = await db.listLedgerEntries(userId);

    return NextResponse.json({
      creditBalance: user.creditBalance,
      plan: user.plan,
      ledger
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value || 'usr_default';
    const { amount, planType } = await req.json();

    const user = await db.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (planType) {
      // Simulate plan upgrade
      let creditsToAdd = 0;
      if (planType === 'pro') creditsToAdd = 500;
      else if (planType === 'agency') creditsToAdd = 2000;
      else if (planType === 'enterprise') creditsToAdd = 10000;

      await db.updateUser(userId, { plan: planType });
      await CreditService.grantCredits(
        userId,
        creditsToAdd,
        `Upgraded to ${planType.toUpperCase()} plan`
      );

      return NextResponse.json({
        success: true,
        message: `Successfully upgraded to ${planType} plan!`,
        creditsAdded: creditsToAdd
      });
    }

    if (amount) {
      // Purchase specific credits amount
      await CreditService.grantCredits(
        userId,
        amount,
        `Purchased ${amount} credits pack`
      );

      return NextResponse.json({
        success: true,
        message: `Successfully purchased ${amount} credits!`,
        creditsAdded: amount
      });
    }

    return NextResponse.json({ error: 'Invalid purchase details' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
