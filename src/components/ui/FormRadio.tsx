// src/components/ui/FormRadio.tsx
'use client';

import React from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useTheme } from '@/contexts/ThemeContext';

interface FormRadioProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
}

export function FormRadio({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
}: FormRadioProps) {
  const { dark } = useTheme();

  return (
    <div className="space-y-1.5">
      <label
        className={`block text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <RadioGroup.Root
        value={value}
        onValueChange={onChange}
        name={name}
        className="flex gap-4"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroup.Item
              value={option.value}
              id={`${name}-${option.value}`}
              className={`w-4 h-4 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#1B3B8B] ${
                dark
                  ? 'bg-[#0f1117] border-[#2a3448] data-[state=checked]:bg-[#1B3B8B]'
                  : 'bg-white border-gray-300 data-[state=checked]:bg-[#1B3B8B]'
              }`}
            >
              <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
            </RadioGroup.Item>
            <label
              htmlFor={`${name}-${option.value}`}
              className={`text-sm cursor-pointer ${dark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup.Root>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
