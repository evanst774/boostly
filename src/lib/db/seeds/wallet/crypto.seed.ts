// src/lib/db/seeds/wallet/crypto.seed.ts
import { db } from '@/lib/db';
import {
  cryptoCurrencies,
  cryptoWallets,
  cryptoRates,
  CryptoCurrencyEnum,
  CryptoNetworkEnum,
  type CryptoCurrency,
  type CryptoWallet,
  type CryptoRate,
} from '@/lib/db/schema/crypto';
import { eq } from 'drizzle-orm';
import type { SeedCryptoResult } from '../types';

export async function seedCrypto(): Promise<SeedCryptoResult> {
  console.log('  ₿ Seeding crypto...');

  const currencyList: CryptoCurrency[] = [];
  const walletList: CryptoWallet[] = [];
  const rateList: CryptoRate[] = [];

  // 1. Create crypto currencies
  const cryptoData = [
    {
      symbol: CryptoCurrencyEnum.BTC,
      name: 'Bitcoin',
      network: CryptoNetworkEnum.BITCOIN,
      icon: '₿',
      decimalPlaces: 8,
      minDeposit: 0.0001,
      minWithdrawal: 0.0005,
      withdrawalFee: 0.0002,
    },
    {
      symbol: CryptoCurrencyEnum.ETH,
      name: 'Ethereum',
      network: CryptoNetworkEnum.ETHEREUM,
      icon: 'Ξ',
      decimalPlaces: 18,
      minDeposit: 0.001,
      minWithdrawal: 0.005,
      withdrawalFee: 0.002,
    },
    {
      symbol: CryptoCurrencyEnum.USDT,
      name: 'Tether',
      network: CryptoNetworkEnum.ETHEREUM,
      icon: '₮',
      decimalPlaces: 6,
      minDeposit: 1,
      minWithdrawal: 5,
      withdrawalFee: 1,
    },
    {
      symbol: CryptoCurrencyEnum.SOL,
      name: 'Solana',
      network: CryptoNetworkEnum.SOLANA,
      icon: '◎',
      decimalPlaces: 8,
      minDeposit: 0.01,
      minWithdrawal: 0.05,
      withdrawalFee: 0.02,
    },
  ];

  for (const data of cryptoData) {
    let existing = await db.query.cryptoCurrencies.findFirst({
      where: eq(cryptoCurrencies.symbol, data.symbol),
    });

    if (!existing) {
      const [currency] = await db
        .insert(cryptoCurrencies)
        .values({
          ...data,
          isActive: true,
          isDepositEnabled: true,
          isWithdrawalEnabled: true,
          confirmationsRequired: 3,
        })
        .returning();
      currencyList.push(currency);
      console.log(`    ✅ Created crypto: ${data.symbol} (${data.name})`);
    } else {
      currencyList.push(existing);
      console.log(`    ⚠️ Crypto exists: ${data.symbol}`);
    }
  }

  // 2. Create crypto wallets for users
  const userList = await db.query.users.findMany({ limit: 5 });
  for (const user of userList) {
    for (const currency of currencyList) {
      const existing = await db.query.cryptoWallets.findFirst({
        where: (cw, { and, eq }) =>
          and(eq(cw.userId, user.id), eq(cw.currency, currency.symbol)),
      });

      if (!existing) {
        const address = `0x${crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`;
        const [wallet] = await db
          .insert(cryptoWallets)
          .values({
            userId: user.id,
            currency: currency.symbol,
            address,
            balance: Math.random() * 0.5,
            totalDeposited: Math.random() * 1,
            totalWithdrawn: 0,
            isActive: true,
            isDefault: false,
          })
          .returning();
        walletList.push(wallet);
        console.log(`      ✅ ${currency.symbol} wallet for ${user.name}`);
      }
    }
  }

  // 3. Create crypto rates
  const rateData = [
    {
      currency: CryptoCurrencyEnum.BTC,
      usdRate: 65000,
      eurRate: 60000,
      rwfRate: 95000000,
      change24h: 2.5,
    },
    {
      currency: CryptoCurrencyEnum.ETH,
      usdRate: 3500,
      eurRate: 3200,
      rwfRate: 5100000,
      change24h: 1.8,
    },
    {
      currency: CryptoCurrencyEnum.USDT,
      usdRate: 1,
      eurRate: 0.92,
      rwfRate: 1470,
      change24h: 0.1,
    },
    {
      currency: CryptoCurrencyEnum.SOL,
      usdRate: 150,
      eurRate: 138,
      rwfRate: 220000,
      change24h: 5.2,
    },
  ];

  for (const data of rateData) {
    const existing = await db.query.cryptoRates.findFirst({
      where: eq(cryptoRates.currency, data.currency),
    });

    if (!existing) {
      const [rate] = await db
        .insert(cryptoRates)
        .values({ ...data, lastUpdated: new Date().toISOString() })
        .returning();
      rateList.push(rate);
      console.log(`    ✅ Created rate: ${data.currency}`);
    } else {
      rateList.push(existing);
      console.log(`    ⚠️ Rate exists: ${data.currency}`);
    }
  }

  return {
    currencies: currencyList,
    wallets: walletList,
    rates: rateList,
    deposits: [],
    withdrawals: [],
  };
}
