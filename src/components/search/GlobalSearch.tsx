// src/components/search/GlobalSearch.tsx
'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  Clock,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  X,
  LayoutDashboard,
  Users,
  AlertCircle,
  Bike,
  Tag,
  Truck,
  Receipt,
  FileText,
  Wallet,
  CalendarClock,
  TrendingDown,
  FileSignature,
  BarChart3,
  LineChart,
  PieChart,
  ShieldCheck,
  History,
  User,
  Shield,
  UserPlus,
  Plus,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { searchStaticItems, QUICK_ACTIONS } from '@/lib/search/static-data';
import type { SearchResultItem, SearchGroupResult } from '@/lib/search/types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  AlertCircle,
  Bike,
  Tag,
  Truck,
  Receipt,
  FileText,
  Wallet,
  CalendarClock,
  TrendingDown,
  FileSignature,
  BarChart3,
  LineChart,
  PieChart,
  ShieldCheck,
  History,
  User,
  Shield,
  UserPlus,
  Plus,
  UserCog,
};

const TYPE_LABELS: Record<string, string> = {
  customer: 'Customers',
  bike: 'Inventory',
  sale: 'Sales',
  contract: 'Contracts',
  supplier: 'Suppliers',
  model: 'Models',
  user: 'Users',
  page: 'Pages',
  action: 'Quick Actions',
};

function ResultIcon({
  icon,
  className,
}: {
  icon?: string;
  className?: string;
}) {
  const Icon = (icon && ICON_MAP[icon]) || Search;
  return <Icon className={className} />;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const q = query.trim().toLowerCase();
  const index = lower.indexOf(q);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="text-indigo-300 font-semibold">
        {text.slice(index, index + q.length)}
      </span>
      {text.slice(index + q.length)}
    </>
  );
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    query,
    setQuery,
    groups,
    loading,
    error,
    recent,
    pushRecent,
    clearRecent,
  } = useGlobalSearch();

  // Reset state every time the palette opens, and autofocus the input
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen, setQuery]);

  const staticGroup: SearchGroupResult | null = useMemo(() => {
    if (!query.trim()) return null;
    const items = searchStaticItems(query);
    if (items.length === 0) return null;
    return { type: 'page', label: 'Pages & Actions', items };
  }, [query]);

  const allGroups: SearchGroupResult[] = useMemo(() => {
    const result: SearchGroupResult[] = [];
    if (staticGroup) result.push(staticGroup);
    result.push(...groups);
    return result;
  }, [staticGroup, groups]);

  const flatItems: SearchResultItem[] = useMemo(
    () => allGroups.flatMap((g) => g.items),
    [allGroups],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [flatItems.length, query]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      pushRecent(query.trim() || item.title);
      onClose();
      router.push(item.href);
    },
    [pushRecent, query, onClose, router],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[activeIndex];
        if (item) handleSelect(item);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatItems, activeIndex, handleSelect, onClose],
  );

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const showEmptyQueryState = !query.trim();
  const showNoResults =
    !loading && !!query.trim() && flatItems.length === 0 && !error;

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/90 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl bg-[#0D1829]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
              {loading ? (
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search customers, bikes, sales, invoices..."
                className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-gray-500 hover:text-white transition-colors shrink-0"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2.5 py-1 text-xs text-gray-400 bg-white/5 rounded-lg border border-white/10 shrink-0">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-2">
              {showEmptyQueryState && (
                <div className="px-2">
                  {recent.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Recent
                        </span>
                        <button
                          onClick={clearRecent}
                          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      {recent.map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="px-3 py-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Quick Actions
                      </span>
                    </div>
                    {QUICK_ACTIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors group"
                      >
                        <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <ResultIcon
                            icon={item.icon}
                            className="w-4 h-4 text-indigo-400"
                          />
                        </span>
                        <span className="min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-gray-500 truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!showEmptyQueryState && error && (
                <div className="px-4 py-8 text-center text-sm text-red-400">
                  {error}
                </div>
              )}

              {!showEmptyQueryState && showNoResults && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-gray-400">
                    No results for{' '}
                    <span className="text-white font-medium">
                      &ldquo;{query}&rdquo;
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Try a different name, phone number, or invoice number.
                  </p>
                </div>
              )}

              {!showEmptyQueryState &&
                !error &&
                allGroups.map((group) => (
                  <div key={group.type + group.label} className="px-2 mb-1">
                    <div className="px-3 py-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {group.label || TYPE_LABELS[group.type]}
                      </span>
                    </div>
                    {group.items.map((item) => {
                      runningIndex += 1;
                      const isActive = runningIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          data-active={isActive}
                          onMouseEnter={() => setActiveIndex(runningIndex)}
                          onClick={() => handleSelect(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isActive ? 'bg-indigo-500/15' : 'hover:bg-white/5'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isActive
                                ? 'bg-indigo-500/20 border-indigo-500/30'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <ResultIcon
                              icon={item.icon}
                              className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-gray-400'}`}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate">
                              {highlightMatch(item.title, query)}
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-gray-500 truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 shrink-0">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-white/10 text-[11px] text-gray-500 shrink-0">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <ArrowDown className="w-3 h-3" />
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                Select
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">
                  Esc
                </kbd>
                Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
