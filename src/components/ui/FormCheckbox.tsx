// src/components/ui/FormCheckbox.tsx
'use client';

import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function FormCheckbox({
  label,
  checked,
  onChange,
  error,
}: FormCheckboxProps) {
  const { dark } = useTheme();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Checkbox.Root
          checked={checked}
          onCheckedChange={onChange}
          className={`w-4 h-4 rounded border focus:outline-none focus:ring-2 focus:ring-[#1B3B8B] ${
            dark
              ? 'bg-[#0f1117] border-[#2a3448] data-[state=checked]:bg-[#1B3B8B] data-[state=checked]:border-[#1B3B8B]'
              : 'bg-white border-gray-300 data-[state=checked]:bg-[#1B3B8B] data-[state=checked]:border-[#1B3B8B]'
          }`}
        >
          <Checkbox.Indicator className="flex items-center justify-center w-full h-full">
            <Check className="w-3 h-3 text-white" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label
          className={`text-sm cursor-pointer ${dark ? 'text-gray-300' : 'text-gray-700'}`}
        >
          {label}
        </label>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
