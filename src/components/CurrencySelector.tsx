// src/components/CurrencySelector.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  FIAT_CURRENCY_INFO,
  FIAT_CURRENCY_LIST,
} from '@/lib/db/schema/currency';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
}

export function CurrencySelector({
  value,
  onChange,
  className = '',
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currencies, setCurrencies] = useState<
    Array<{ code: string; symbol: string; name: string }>
  >([]);

  useEffect(() => {
    const list = FIAT_CURRENCY_LIST.map((code) => ({
      code,
      symbol: getCurrencySymbol(code),
      name:
        FIAT_CURRENCY_INFO[code as keyof typeof FIAT_CURRENCY_INFO]?.name ||
        code,
    }));
    setCurrencies(list);
  }, []);

  const selected = currencies.find((c) => c.code === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F3F4F6] rounded-xl hover:border-[#2563EB] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold">{selected?.symbol || value}</span>
        <span className="text-[#6B7280]">{selected?.code || value}</span>
        <ChevronDown
          size={16}
          className={cn(
            'text-[#6B7280] transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-[#F3F4F6] shadow-lg z-50 max-h-60 overflow-y-auto">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors text-left',
                currency.code === value && 'bg-[#EFF6FF]',
              )}
              onClick={() => {
                onChange(currency.code);
                setIsOpen(false);
              }}
            >
              <span className="w-8 font-bold">{currency.symbol}</span>
              <span className="flex-1 text-sm">{currency.code}</span>
              <span className="text-xs text-[#6B7280]">{currency.name}</span>
              {currency.code === value && (
                <Check size={16} className="text-[#2563EB]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
