// src/components/ui/FormInput.tsx
'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({
  label,
  error,
  className = '',
  id,
  ...props
}: FormInputProps) {
  const { dark } = useTheme();
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B3B8B] focus:border-transparent transition-all ${
          dark
            ? 'bg-[#0f1117] border-[#2a3448] text-white placeholder-gray-500'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
