// src/components/ui/FormSelect.tsx
'use client';

import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormSelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  required?: boolean;
  error?: string;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
  placeholder = 'Select an option',
  searchable = false,
  className,
  disabled = false,
}: FormSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ALL_VALUE = '__all__';

  const validOptions = options.filter((opt) => opt.value !== '');
  const allOption = options.find((opt) => opt.value === '');

  const filteredOptions =
    searchable && searchTerm
      ? validOptions.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : validOptions;

  const selectedOption = options.find((opt) => opt.value === value);
  const selectValue = value === '' || !value ? ALL_VALUE : value;

  const handleValueChange = (newValue: string) => {
    onChange(newValue === ALL_VALUE ? '' : newValue);
    setSearchTerm('');
  };

  const stopAll = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <Select.Root
        value={selectValue}
        onValueChange={handleValueChange}
        name={name}
        disabled={disabled}
        onOpenChange={(open) => {
          if (!open) setSearchTerm('');
          if (open && searchable) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Select.Trigger
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 text-sm',
            'bg-white dark:bg-[#0F172A] border-[#F1F5F9] dark:border-[#334155]',
            'hover:border-[#2563EB] dark:hover:border-[#60A5FA]',
            'focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20',
            'data-[placeholder]:text-[#94A3B8]',
            value ? 'text-[#0F172A] dark:text-white' : 'text-[#94A3B8]',
            error &&
              'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Select.Value placeholder={placeholder}>
            {selectedOption?.label || placeholder}
          </Select.Value>
          <Select.Icon>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] transition-transform duration-200 data-[state=open]:rotate-180" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className={cn(
              'overflow-hidden rounded-xl border shadow-2xl z-[100]',
              'bg-white dark:bg-[#1E293B]',
              'border-[#F1F5F9] dark:border-[#334155]',
              'animate-in fade-in-0 zoom-in-95',
            )}
            position="popper"
            sideOffset={5}
            align="start"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {searchable && (
              <div className="p-2 border-b border-[#F1F5F9] dark:border-[#334155]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#F1F5F9] dark:border-[#334155] text-[#0F172A] dark:text-white text-xs placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    onClick={stopAll}
                    onPointerDown={stopAll}
                    onPointerUp={stopAll}
                    onKeyDown={stopAll}
                    onKeyUp={stopAll}
                    onKeyPress={stopAll}
                    onFocus={stopAll}
                  />
                </div>
              </div>
            )}

            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gradient-to-b from-white dark:from-[#1E293B] to-transparent cursor-default">
              <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
            </Select.ScrollUpButton>

            <Select.Viewport className="p-1 max-h-60 overflow-y-auto">
              {allOption && (
                <Select.Item
                  value={ALL_VALUE}
                  className={cn(
                    'relative flex items-center px-8 py-2.5 rounded-lg text-sm cursor-pointer outline-none transition-all duration-150',
                    'text-[#64748B] dark:text-[#94A3B8]',
                    'hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white',
                    'focus:bg-[#F8FAFC] dark:focus:bg-[#334155] focus:text-[#0F172A] dark:focus:text-white',
                    'data-[highlighted]:bg-[#2563EB]/10 data-[highlighted]:text-[#2563EB] dark:data-[highlighted]:text-[#60A5FA]',
                    'data-[state=checked]:bg-[#2563EB]/10 data-[state=checked]:text-[#2563EB] dark:data-[state=checked]:text-[#60A5FA]',
                  )}
                >
                  <Select.ItemIndicator className="absolute left-2.5 inline-flex items-center">
                    <Check className="w-4 h-4 text-[#2563EB]" />
                  </Select.ItemIndicator>
                  <Select.ItemText>
                    <span className="font-medium">{allOption.label}</span>
                  </Select.ItemText>
                </Select.Item>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-[#94A3B8]">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      'relative flex items-center px-8 py-2.5 rounded-lg text-sm cursor-pointer outline-none transition-all duration-150',
                      'text-[#64748B] dark:text-[#94A3B8]',
                      'hover:bg-[#F8FAFC] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white',
                      'focus:bg-[#F8FAFC] dark:focus:bg-[#334155] focus:text-[#0F172A] dark:focus:text-white',
                      'data-[highlighted]:bg-[#2563EB]/10 data-[highlighted]:text-[#2563EB] dark:data-[highlighted]:text-[#60A5FA]',
                      'data-[state=checked]:bg-[#2563EB]/10 data-[state=checked]:text-[#2563EB] dark:data-[state=checked]:text-[#60A5FA]',
                    )}
                  >
                    <Select.ItemIndicator className="absolute left-2.5 inline-flex items-center">
                      <Check className="w-4 h-4 text-[#2563EB]" />
                    </Select.ItemIndicator>
                    <Select.ItemText>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-[#94A3B8] mt-0.5">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </Select.ItemText>
                  </Select.Item>
                ))
              )}
            </Select.Viewport>

            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gradient-to-t from-white dark:from-[#1E293B] to-transparent cursor-default">
              <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
