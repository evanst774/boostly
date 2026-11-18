// src/hooks/useSystemCurrency.ts
import { useState, useEffect, useCallback } from 'react';

interface SystemCurrency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

const FALLBACK: SystemCurrency = {
  code: 'RWF',
  symbol: 'FRw',
  name: 'Rwandan Franc',
  decimalPlaces: 0,
};

export function useSystemCurrency() {
  const [currency, setCurrency] = useState<SystemCurrency>(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemCurrency = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/currency');
      if (!response.ok) {
        throw new Error(`Currency endpoint returned ${response.status}`);
      }
      const data = await response.json();
      setCurrency({
        code: data.baseCurrency || FALLBACK.code,
        symbol: data.currencySymbol || FALLBACK.symbol,
        name: data.currencyName || FALLBACK.name,
        decimalPlaces: data.decimalPlaces ?? FALLBACK.decimalPlaces,
      });
    } catch (err) {
      console.error('Failed to fetch system currency:', err);
      setError(err instanceof Error ? err.message : 'Failed to load currency');
      setCurrency(FALLBACK);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemCurrency();
  }, [fetchSystemCurrency]);

  // One money style app-wide: "1,000 RWF". RWF has no minor unit, so it is
  // always shown in whole francs whatever decimalPlaces the settings say.
  const formatAmount = (amount: number): string => {
    const places = currency.code === 'RWF' ? 0 : currency.decimalPlaces;
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    });
    return `${formatter.format(amount)} ${currency.code}`;
  };

  return {
    currency,
    isLoading,
    error,
    formatAmount,
    refetch: fetchSystemCurrency,
  };
}
