// src/components/admin/GlobalSearch.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Fixed: Removed unused router import
// import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Loader2,
  Users,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  Heart,
  Calendar,
  Newspaper,
  FolderOpen,
  User,
  MapPin,
  Clock,
  ChevronRight,
  File,
  Video,
  Music,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchItemDetails } from './SearchItemDetails';

// Fixed: Removed empty interface - replaced with direct type usage
// interface IconComponent extends React.FC<{
//   size?: number;
//   className?: string;
// }> {
//   // This allows any Lucide icon component
// }

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  url: string;
  image?: string;
  thumbnail?: string;
  email?: string;
  studentId?: string;
  status?: string;
  location?: string;
  startDate?: string;
  author?: string;
}

interface SearchResponse {
  results: SearchResult[];
  grouped: Record<string, SearchResult[]>;
  total: number;
  query: string;
}

// Fixed: Removed unused CategoryIconMap interface
// interface CategoryIconMap {
//   [key: string]: IconComponent;
// }

export function GlobalSearch({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { dark } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Fixed: Replaced 'any' with proper type
  const [selectedItemForDetails, setSelectedItemForDetails] =
    useState<SearchResult | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const cardBg = dark ? '#1e2333' : '#ffffff';
  const cardBorder = dark ? '#252c3d' : '#e2e8f0';
  const textPrimary = dark ? '#e8eaf2' : '#1f2937';
  const textMuted = dark ? '#8b92a5' : '#64748b';
  const inputBg = dark ? '#0f1117' : '#f8fafc';
  const activeGradient = 'linear-gradient(135deg, #4f6ef7, #3b55d4)';

  const searchTypes = [
    { value: 'all', label: 'All', icon: Search },
    { value: 'students', label: 'Students', icon: Users },
    { value: 'programs', label: 'Programs', icon: GraduationCap },
    { value: 'applications', label: 'Applications', icon: FileText },
    { value: 'media', label: 'Media', icon: ImageIcon },
    { value: 'activities', label: 'Activities', icon: Heart },
    { value: 'events', label: 'Events', icon: Calendar },
    { value: 'news', label: 'News', icon: Newspaper },
  ];

  const getCategoryIcon = (category: string) => {
    // Map categories to their icon components
    const iconMap: Record<string, React.ElementType> = {
      Students: Users,
      Programs: GraduationCap,
      Applications: FileText,
      Media: ImageIcon,
      'Campus Activities': Heart,
      'Campus Events': Calendar,
      News: Newspaper,
      Gallery: FolderOpen,
    };

    const IconComponent = iconMap[category] || File;
    return <IconComponent size={14} />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={12} />;
      case 'video':
        return <Video size={12} />;
      case 'audio':
        return <Music size={12} />;
      default:
        return <File size={12} />;
    }
  };

  const performSearch = useCallback(async () => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        type: selectedType,
        limit: '50',
      });
      const res = await fetch(`/api/admin/search?${params}`);
      const data = await res.json();
      setResults(data);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(debounceTimeout.current);
  }, [query, selectedType, performSearch]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // If details modal is open, don't interfere with its keyboard handling
      if (isDetailsOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const total = results?.results.length || 0;
          return prev < total - 1 ? prev + 1 : prev;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (
        e.key === 'Enter' &&
        selectedIndex >= 0 &&
        results?.results[selectedIndex]
      ) {
        e.preventDefault();
        // Open details modal instead of navigating away
        setSelectedItemForDetails(results.results[selectedIndex]);
        setIsDetailsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDetailsOpen, selectedIndex, results, onClose]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-3xl rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            {/* Search Input */}
            <div
              className="flex items-center gap-3 p-4 border-b"
              style={{ borderColor: cardBorder }}
            >
              <Search size={20} style={{ color: textMuted }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students, programs, media, events..."
                className="flex-1 bg-transparent outline-none text-lg"
                style={{ color: textPrimary }}
              />
              <span
                className="text-xs px-2 py-1 rounded-md font-mono"
                style={{ background: inputBg, color: textMuted }}
              >
                ESC
              </span>
            </div>

            {/* Search Types */}
            <div
              className="flex gap-1 p-3 border-b overflow-x-auto"
              style={{ borderColor: cardBorder }}
            >
              {searchTypes.map((type) => {
                const Icon = type.icon;
                const isActive = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${
                      isActive ? 'text-white' : ''
                    }`}
                    style={{
                      background: isActive ? activeGradient : 'transparent',
                      color: isActive ? '#fff' : textMuted,
                    }}
                  >
                    <Icon size={14} />
                    {type.label}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={32}
                    className="animate-spin"
                    style={{ color: '#4f6ef7' }}
                  />
                </div>
              ) : !query || query.length < 2 ? (
                <div className="text-center py-12">
                  <Search
                    size={48}
                    className="mx-auto mb-3 opacity-30"
                    style={{ color: textMuted }}
                  />
                  <p className="text-sm" style={{ color: textMuted }}>
                    Type at least 2 characters to search
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      Try: &quot;students&quot;
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      Try: &quot;programs&quot;
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      Try: &quot;events&quot;
                    </span>
                  </div>
                </div>
              ) : results?.total === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-sm" style={{ color: textMuted }}>
                    No results found for &quot;{query}&quot;
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {Object.entries(results?.grouped || {}).map(
                    ([category, items]) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-b last:border-b-0"
                        style={{ borderColor: cardBorder }}
                      >
                        <div
                          className="px-4 py-2 sticky top-0"
                          style={{
                            background: cardBg,
                            borderBottom: `1px solid ${cardBorder}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            <h3
                              className="text-xs font-semibold uppercase tracking-wider"
                              style={{ color: textMuted }}
                            >
                              {category}
                            </h3>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: inputBg, color: textMuted }}
                            >
                              {items.length}
                            </span>
                          </div>
                        </div>
                        <div>
                          {items.map((item, idx) => {
                            const globalIndex = results!.results.findIndex(
                              (r) => r.id === item.id && r.type === item.type,
                            );
                            return (
                              <motion.div
                                key={`${item.type}-${item.id}`}
                                data-index={globalIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                                  globalIndex === selectedIndex
                                    ? 'bg-[#4f6ef7]/10'
                                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                                onClick={() => {
                                  // Open details modal instead of navigating
                                  setSelectedItemForDetails(item);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                {/* Thumbnail/Icon - Fixed with proper null handling */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 relative">
                                  {(() => {
                                    const imageSrc =
                                      item.thumbnail || item.image;
                                    if (imageSrc) {
                                      return (
                                        <Image
                                          src={imageSrc}
                                          alt={item.name}
                                          fill
                                          className="object-cover"
                                          sizes="40px"
                                          onError={(e) => {
                                            // Hide image on error
                                            e.currentTarget.style.display =
                                              'none';
                                          }}
                                        />
                                      );
                                    }
                                    return (
                                      <div className="w-full h-full flex items-center justify-center">
                                        {getTypeIcon(item.type)}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p
                                      className="text-sm font-medium truncate"
                                      style={{ color: textPrimary }}
                                    >
                                      {item.name}
                                    </p>
                                    {item.status && (
                                      <span
                                        className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                        style={{
                                          background:
                                            item.status === 'APPROVED' ||
                                            item.status === 'ACTIVE' ||
                                            item.status === 'PUBLISHED'
                                              ? '#22c55e20'
                                              : '#f59e0b20',
                                          color:
                                            item.status === 'APPROVED' ||
                                            item.status === 'ACTIVE' ||
                                            item.status === 'PUBLISHED'
                                              ? '#22c55e'
                                              : '#f59e0b',
                                        }}
                                      >
                                        {item.status}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p
                                      className="text-xs mt-0.5 line-clamp-1"
                                      style={{ color: textMuted }}
                                    >
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {item.email && (
                                      <span
                                        className="text-[10px]"
                                        style={{ color: textMuted }}
                                      >
                                        {item.email}
                                      </span>
                                    )}
                                    {item.studentId && (
                                      <span
                                        className="text-[10px]"
                                        style={{ color: textMuted }}
                                      >
                                        ID: {item.studentId}
                                      </span>
                                    )}
                                    {item.location && (
                                      <div className="flex items-center gap-0.5">
                                        <MapPin
                                          size={9}
                                          style={{ color: textMuted }}
                                        />
                                        <span
                                          className="text-[10px]"
                                          style={{ color: textMuted }}
                                        >
                                          {item.location}
                                        </span>
                                      </div>
                                    )}
                                    {item.startDate && (
                                      <div className="flex items-center gap-0.5">
                                        <Clock
                                          size={9}
                                          style={{ color: textMuted }}
                                        />
                                        <span
                                          className="text-[10px]"
                                          style={{ color: textMuted }}
                                        >
                                          {new Date(
                                            item.startDate,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                    {item.author && (
                                      <div className="flex items-center gap-0.5">
                                        <User
                                          size={9}
                                          style={{ color: textMuted }}
                                        />
                                        <span
                                          className="text-[10px]"
                                          style={{ color: textMuted }}
                                        >
                                          {item.author}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <ChevronRight
                                  size={16}
                                  style={{ color: textMuted }}
                                />
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              )}

              {results?.results && results.results.length > 0 && (
                <div
                  className="px-4 py-3 border-t text-center"
                  style={{ borderColor: cardBorder }}
                >
                  <p className="text-xs" style={{ color: textMuted }}>
                    {results.total} result{results.total !== 1 ? 's' : ''} found
                  </p>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Search Item Details Modal */}
      <SearchItemDetails
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedItemForDetails(null);
          // Refocus the search input when closing details
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        item={selectedItemForDetails}
      />
    </>
  );
}
