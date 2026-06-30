import db from '@/lib/db/json-db';

export class CreditService {
  /**
   * Check if a user has sufficient credits.
   */
  static async hasSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const user = await db.getUser(userId);
    if (!user) return false;
    return user.creditBalance >= requiredAmount;
  }

  /**
   * Deduct credits from a user's balance and log in the ledger.
   */
  static async deductCredits(
    userId: string,
    amount: number,
    generationId: string | null,
    description: string
  ): Promise<boolean> {
    const user = await db.getUser(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    if (user.creditBalance < amount) {
      return false; // Insufficient credits
    }

    await db.createLedgerEntry({
      userId,
      action: 'deduct',
      amount,
      generationId,
      description
    });

    return true;
  }

  /**
   * Refund credits to a user's balance and log in the ledger.
   */
  static async refundCredits(
    userId: string,
    amount: number,
    generationId: string | null,
    description: string
  ): Promise<void> {
    const user = await db.getUser(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    await db.createLedgerEntry({
      userId,
      action: 'refund',
      amount,
      generationId,
      description: `Refund: ${description}`
    });
  }

  /**
   * Grant credits to a user (e.g., admin adjustment or package purchase).
   */
  static async grantCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<void> {
    const user = await db.getUser(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    await db.createLedgerEntry({
      userId,
      action: 'grant',
      amount,
      generationId: null,
      description
    });
  }

  /**
   * Get a user's credit balance.
   */
  static async getBalance(userId: string): Promise<number> {
    const user = await db.getUser(userId);
    if (!user) return 0;
    return user.creditBalance;
  }
}
export default CreditService;
