// src/lib/db/seeds/social/referrals.seed.ts
import { db } from '@/lib/db';
import { referrals, referralCodes } from '@/lib/db/schema/referrals';
import { eq } from 'drizzle-orm';
import type { SeedReferralsResult } from '../types';
import { generateReferralCode } from '../utils';

export async function seedReferrals(): Promise<SeedReferralsResult> {
  console.log('  👥 Seeding referrals...');

  const codeList = [];
  const referralList = [];

  const userList = await db.query.users.findMany({ limit: 5 });

  if (userList.length < 2) {
    console.log('    ⚠️ Not enough users');
    return { codes: [], referrals: [] };
  }

  // Create referral codes
  for (const user of userList) {
    const existing = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.userId, user.id),
    });

    if (!existing) {
      const code = generateReferralCode(user.id);
      const [newCode] = await db
        .insert(referralCodes)
        .values({
          userId: user.id,
          code,
          isActive: true,
          timesUsed: 0,
        })
        .returning();
      codeList.push(newCode);
      console.log(`    ✅ Code for ${user.name}`);
    } else {
      codeList.push(existing);
    }
  }

  // Create referrals
  for (let i = 1; i < userList.length; i++) {
    const referrer = userList[i - 1];
    const referee = userList[i];

    const existing = await db.query.referrals.findFirst({
      where: eq(referrals.refereeId, referee.id),
    });

    if (!existing) {
      const code = codeList.find((c) => c.userId === referrer.id);
      if (code) {
        const [newReferral] = await db
          .insert(referrals)
          .values({
            referrerId: referrer.id,
            refereeId: referee.id,
            code: code.code,
            status: i % 2 === 0 ? 'ACTIVE' : 'PENDING',
            referrerReward: 200,
            refereeReward: 50,
            referrerRewardClaimed: i % 2 === 0,
            refereeRewardClaimed: true,
            joinedAt: new Date().toISOString(),
            activatedAt: i % 2 === 0 ? new Date().toISOString() : undefined,
          })
          .returning();
        referralList.push(newReferral);
        console.log(`    ✅ ${referrer.name} → ${referee.name}`);
      }
    } else {
      referralList.push(existing);
    }
  }

  return { codes: codeList, referrals: referralList };
}
