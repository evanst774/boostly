// src/app/(dashboard)/wallet/withdraw/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Landmark,
  Smartphone,
  Bitcoin,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { useWalletData } from '@/hooks/useWalletData';
import { cn, formatCurrency } from '@/lib/utils';

type WithdrawMethod = 'mobile_money' | 'bank_transfer' | 'crypto';

export default function WithdrawPage() {
  const router = useRouter();
  const { data } = useWalletData();
  const [method, setMethod] = useState<WithdrawMethod>('mobile_money');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const wallet = data?.wallet || { balance: 0 };

  const quickAmounts = [5000, 10000, 15000, 25000, 50000];

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1000) {
      alert('Minimum withdrawal is 1,000 RWF');
      return;
    }
    if (amountNum > wallet.balance) {
      alert('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          method,
          phoneNumber: method === 'mobile_money' ? phoneNumber : undefined,
          bankAccount: method === 'bank_transfer' ? bankAccount : undefined,
          bankName: method === 'bank_transfer' ? bankName : undefined,
          accountName: method === 'bank_transfer' ? accountName : undefined,
          cryptoAddress: method === 'crypto' ? cryptoAddress : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to process withdrawal');

      await response.json();
      router.push('/wallet/withdraw/success');
    } catch {
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (m: WithdrawMethod) => {
    switch (m) {
      case 'mobile_money':
        return <Smartphone size={20} />;
      case 'bank_transfer':
        return <Landmark size={20} />;
      case 'crypto':
        return <Bitcoin size={20} />;
    }
  };

  const getMethodLabel = (m: WithdrawMethod) => {
    switch (m) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'crypto':
        return 'Crypto Withdrawal';
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-xl border border-[#F3F4F6] flex items-center justify-center hover:border-[#2563EB] transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Withdraw</h1>
          <p className="text-sm text-[#6B7280]">Withdraw your earnings</p>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-[#F0FDF4] border border-[#22C55E] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6B7280]">Available Balance</p>
          <p className="text-2xl font-extrabold text-[#22C55E]">
            {formatCurrency(wallet.balance)}
          </p>
        </div>
        <span className="bg-[#22C55E] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
          <Check size={12} />
          Verified
        </span>
      </div>

      {/* Method Selection */}
      <div>
        <p className="text-sm font-bold mb-3">Select Method</p>
        <div className="grid grid-cols-3 gap-3">
          {(
            ['mobile_money', 'bank_transfer', 'crypto'] as WithdrawMethod[]
          ).map((m) => (
            <button
              key={m}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                method === m
                  ? 'border-[#2563EB] bg-[#EFF6FF]'
                  : 'border-[#F3F4F6] hover:border-[#2563EB]',
              )}
              onClick={() => setMethod(m)}
            >
              <span
                className={cn(
                  'text-2xl',
                  method === m ? 'text-[#2563EB]' : 'text-[#6B7280]',
                )}
              >
                {getMethodIcon(m)}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  method === m ? 'text-[#2563EB]' : 'text-[#6B7280]',
                )}
              >
                {getMethodLabel(m)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Method-specific fields */}
      {method === 'mobile_money' && (
        <div>
          <p className="text-sm font-bold mb-2">Mobile Number</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B7280]">
              +250
            </span>
            <input
              type="tel"
              placeholder="780 000 000"
              className="w-full pl-16 pr-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>
      )}

      {method === 'bank_transfer' && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold mb-2">Bank Name</p>
            <input
              type="text"
              placeholder="e.g. Bank of Kigali"
              className="w-full px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm font-bold mb-2">Account Number</p>
            <input
              type="text"
              placeholder="Enter account number"
              className="w-full px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm font-bold mb-2">Account Name</p>
            <input
              type="text"
              placeholder="Enter account holder name"
              className="w-full px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
        </div>
      )}

      {method === 'crypto' && (
        <div>
          <p className="text-sm font-bold mb-2">Crypto Address</p>
          <input
            type="text"
            placeholder="Enter wallet address"
            className="w-full px-4 py-3 border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
            value={cryptoAddress}
            onChange={(e) => setCryptoAddress(e.target.value)}
          />
          <div className="flex items-center gap-2 mt-2 text-xs text-[#6B7280]">
            <Info size={14} />
            <span>Supported: BTC, ETH, USDT (ERC20/BEP20)</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <p className="text-sm font-bold mb-2">Amount (RWF)</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B7280]">
            Rwf
          </span>
          <input
            type="number"
            placeholder="0"
            className="w-full pl-16 pr-4 py-3 text-2xl font-extrabold border border-[#F3F4F6] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <p className="text-xs text-[#6B7280] mt-2">
          Min: 1,000 RWF · Max: {formatCurrency(wallet.balance)}
        </p>
      </div>

      {/* Quick Amounts */}
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((amt) => (
          <button
            key={amt}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold border transition-all',
              parseFloat(amount) === amt
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'border-[#F3F4F6] hover:border-[#2563EB]',
            )}
            onClick={() => setAmount(amt.toString())}
          >
            {formatCurrency(amt)}
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex gap-3">
        <AlertCircle
          size={20}
          className="text-[#B45309] flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="text-sm font-semibold text-[#92400E]">
            Processing Info
          </p>
          <p className="text-sm text-[#B45309] mt-0.5">
            Withdrawals are processed on 1st–5th of each month. No fees for
            Mobile Money transfers.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
        <p className="text-sm font-bold mb-4">Summary</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280]">Amount</span>
            <span className="font-semibold">
              {amount ? formatCurrency(parseFloat(amount)) : 'Rwf 0'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280]">Processing fee</span>
            <span className="font-semibold text-[#22C55E]">Free</span>
          </div>
          <div className="border-t border-[#F3F4F6] pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold">You receive</span>
              <span className="font-bold text-[#22C55E]">
                {amount ? formatCurrency(parseFloat(amount)) : 'Rwf 0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        className="w-full bg-[#2563EB] text-white font-bold py-4 rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleWithdraw}
        disabled={
          isLoading ||
          !amount ||
          parseFloat(amount) < 1000 ||
          parseFloat(amount) > wallet.balance
        }
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </span>
        ) : (
          'Withdraw Now'
        )}
      </button>
    </div>
  );
}
