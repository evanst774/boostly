// src/components/crypto/CryptoWallet.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface CryptoWalletProps {
  userId: string;
}

interface CryptoWalletData {
  id: string;
  currency: string;
  balance: number;
  address: string;
}

interface CryptoRate {
  currency: string;
  usdRate: number;
}

const CRYPTO_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: '⟠',
  USDT: '₮',
  USDC: '₮',
  SOL: '◎',
  XRP: '✕',
  ADA: '₳',
  DOT: '●',
  AVAX: '❄',
  MATIC: '◇',
};

export function CryptoWallet({ userId }: CryptoWalletProps) {
  const [wallets, setWallets] = useState<CryptoWalletData[]>([]);
  const [rates, setRates] = useState<CryptoRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletsRes, ratesRes] = await Promise.all([
        fetch(`/api/crypto/wallets?userId=${userId}`),
        fetch('/api/crypto/rates'),
      ]);
      const walletsData = await walletsRes.json();
      const ratesData = await ratesRes.json();
      setWallets(walletsData.wallets || []);
      setRates(ratesData.rates || []);
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async (address: string, id: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getRate = (currency: string) => {
    const rate = rates.find((r) => r.currency === currency);
    return rate?.usdRate || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading crypto wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Crypto Wallet</h3>
          <p className="text-white/40 text-sm">
            Manage your cryptocurrency balances
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Wallet Cards */}
      <div className="grid gap-4">
        {wallets.map((wallet) => {
          const rate = getRate(wallet.currency);
          const usdBalance = wallet.balance * rate;
          const icon = CRYPTO_ICONS[wallet.currency] || '🪙';

          return (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xl">
                    {icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {wallet.currency}
                    </p>
                    <p className="text-white/40 text-xs">
                      Wallet ID: {wallet.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    {wallet.balance.toFixed(8)}
                  </p>
                  <p className="text-white/40 text-xs">
                    ≈ ${usdBalance.toFixed(2)} USD
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="mt-3 p-2 bg-white/5 rounded-lg flex items-center justify-between">
                <code className="text-white/60 text-xs font-mono truncate">
                  {wallet.address}
                </code>
                <button
                  onClick={() => copyAddress(wallet.address, wallet.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                >
                  {copied === wallet.id ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-sm font-medium transition-colors">
                  <ArrowDownToLine className="w-4 h-4" />
                  Deposit
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition-colors">
                  <ArrowUpFromLine className="w-4 h-4" />
                  Withdraw
                </button>
                <button className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {wallets.length === 0 && (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No crypto wallets found</p>
        </div>
      )}
    </div>
  );
}
