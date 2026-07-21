// src/components/admin/SearchItemDetails.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Users,
  GraduationCap,
  Heart,
  Newspaper,
  FolderOpen,
  Loader2,
  CalendarDays,
  Eye,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

// Fixed: Added proper type for detailed item
interface DetailedItem {
  id: string;
  name: string;
  title?: string;
  description?: string;
  category: string;
  type: string;
  url?: string;
  image?: string;
  thumbnail?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  views?: number;
  downloads?: number;
  duration?: string;
  fileSize?: string;
  mimeType?: string;
}

interface SearchItemDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    description?: string;
    category: string;
    type: string;
    url?: string;
    image?: string;
    thumbnail?: string;
    email?: string;
    phone?: string;
    studentId?: string;
    status?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
    views?: number;
    downloads?: number;
    duration?: string;
    fileSize?: string;
    mimeType?: string;
  } | null;
}

export function SearchItemDetails({
  isOpen,
  onClose,
  item,
}: SearchItemDetailsProps) {
  const { dark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  // Fixed: Replaced 'any' with proper DetailedItem type
  const [detailedItem, setDetailedItem] = useState<DetailedItem | null>(null);

  const cardBg = dark ? '#1e2333' : '#ffffff';
  const cardBorder = dark ? '#252c3d' : '#e2e8f0';
  const textPrimary = dark ? '#e8eaf2' : '#1f2937';
  const textMuted = dark ? '#8b92a5' : '#64748b';
  const inputBg = dark ? '#0f1117' : '#f8fafc';
  const activeGradient = 'linear-gradient(135deg, #4f6ef7, #3b55d4)';
  const successColor = '#22c55e';
  const warningColor = '#f59e0b';
  const dangerColor = '#ef4444';

  // Fixed: Wrapped fetchDetails in useCallback
  const fetchDetails = useCallback(async () => {
    if (!item?.id) return;

    setIsLoading(true);
    try {
      let endpoint = '';
      switch (item?.category) {
        case 'Students':
          endpoint = `/api/admin/students/${item.id}`;
          break;
        case 'Programs':
          endpoint = `/api/admin/programs/${item.id}`;
          break;
        case 'Applications':
          endpoint = `/api/admin/applications/${item.id}`;
          break;
        case 'Campus Activities':
          endpoint = `/api/admin/campus/activities/${item.id}`;
          break;
        case 'Campus Events':
          endpoint = `/api/admin/campus/events/${item.id}`;
          break;
        case 'News':
          endpoint = `/api/admin/content/news/${item.id}`;
          break;
        case 'Gallery':
          endpoint = `/api/admin/campus/gallery/${item.id}`;
          break;
        default:
          return;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (res.ok) {
        let itemData = data;
        if (data.student) itemData = data.student;
        if (data.program) itemData = data.program;
        if (data.application) itemData = data.application;
        if (data.activity) itemData = data.activity;
        if (data.event) itemData = data.event;
        if (data.news) itemData = data.news;
        if (data.gallery) itemData = data.gallery;

        setDetailedItem({ ...item, ...itemData } as DetailedItem);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setDetailedItem(item as DetailedItem);
    } finally {
      setIsLoading(false);
    }
  }, [item]);

  // Fixed: Added fetchDetails to dependency array
  useEffect(() => {
    if (isOpen && item && item.id && item.category !== 'Media') {
      fetchDetails();
    } else if (item && item.category === 'Media') {
      setDetailedItem(item as DetailedItem);
    }
  }, [isOpen, item, fetchDetails]);

  const getStatusColor = (status?: string) => {
    if (!status) return textMuted;
    const upperStatus = status.toUpperCase();
    if (
      upperStatus === 'PUBLISHED' ||
      upperStatus === 'ACTIVE' ||
      upperStatus === 'APPROVED' ||
      upperStatus === 'ENROLLED'
    ) {
      return successColor;
    }
    if (
      upperStatus === 'DRAFT' ||
      upperStatus === 'PENDING' ||
      upperStatus === 'REVIEWING'
    ) {
      return warningColor;
    }
    if (
      upperStatus === 'REJECTED' ||
      upperStatus === 'INACTIVE' ||
      upperStatus === 'SUSPENDED'
    ) {
      return dangerColor;
    }
    return textMuted;
  };

  const getStatusBg = (status?: string) => {
    const color = getStatusColor(status);
    return `${color}15`;
  };

  // Fixed: Replaced 'any' with proper React.ElementType
  const getCategoryIcon = () => {
    const icons: Record<string, React.ElementType> = {
      Students: Users,
      Programs: GraduationCap,
      Applications: FileText,
      Media: ImageIcon,
      'Campus Activities': Heart,
      'Campus Events': Calendar,
      News: Newspaper,
      Gallery: FolderOpen,
    };
    const Icon = icons[item?.category || ''] || File;
    return <Icon size={18} />;
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={14} />;
      case 'video':
        return <Video size={14} />;
      case 'audio':
        return <Music size={14} />;
      default:
        return <File size={14} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (!item) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={40}
                className="animate-spin"
                style={{ color: '#4f6ef7' }}
              />
            </div>
          ) : (
            <>
              {/* Header - Compact */}
              <div className="relative">
                {/* Background gradient */}
                <div className="h-20 bg-gradient-to-r from-[#1a2f6e] to-[#2a4596]" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm"
                >
                  <X size={16} />
                </button>

                {/* Avatar/Icon circle */}
                <div className="absolute -bottom-6 left-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2"
                    style={{
                      background: activeGradient,
                      borderColor: cardBg,
                    }}
                  >
                    {getCategoryIcon()}
                  </div>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 pt-8">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h2
                      className="text-lg font-bold line-clamp-2"
                      style={{ color: textPrimary }}
                    >
                      {detailedItem?.name || detailedItem?.title || item.name}
                    </h2>
                    {item.studentId && (
                      <p
                        className="text-xs mt-0.5 font-mono"
                        style={{ color: textMuted }}
                      >
                        {item.studentId}
                      </p>
                    )}
                  </div>
                  {item.status && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{
                        background: getStatusBg(item.status),
                        color: getStatusColor(item.status),
                      }}
                    >
                      {item.status}
                    </span>
                  )}
                </div>

                {/* Quick Info Chips - Compact */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.email && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      <Mail size={10} />
                      <span className="truncate max-w-[150px]">
                        {item.email}
                      </span>
                    </div>
                  )}
                  {item.phone && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      <Phone size={10} />
                      <span>{item.phone}</span>
                    </div>
                  )}
                  {item.location && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      <MapPin size={10} />
                      <span className="truncate max-w-[120px]">
                        {item.location}
                      </span>
                    </div>
                  )}
                  {item.type &&
                    item.type !== 'student' &&
                    item.type !== 'program' && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                        style={{ background: inputBg, color: textMuted }}
                      >
                        {getTypeIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </div>
                    )}
                  {item.fileSize && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      <FileText size={10} />
                      <span>{item.fileSize}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <div className="mb-4">
                    <div
                      className="text-sm p-3 rounded-lg leading-relaxed"
                      style={{ background: inputBg, color: textMuted }}
                    >
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Media Preview - Fixed: Replaced img with Next.js Image */}
                {(item.thumbnail || item.image) &&
                  (item.category === 'Media' ||
                    item.category === 'Gallery') && (
                    <div className="mb-4">
                      <div
                        className="relative rounded-lg overflow-hidden cursor-pointer group aspect-video"
                        onClick={() =>
                          window.open(item.thumbnail || item.image, '_blank')
                        }
                      >
                        <Image
                          src={item.thumbnail || item.image || ''}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 90vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                {/* Meta Info Grid - 2 columns */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {item.startDate && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <CalendarDays size={12} />
                      <span>Starts: {formatDate(item.startDate)}</span>
                    </div>
                  )}
                  {item.endDate && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <CalendarDays size={12} />
                      <span>Ends: {formatDate(item.endDate)}</span>
                    </div>
                  )}
                  {item.duration && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <Clock size={12} />
                      <span>Duration: {item.duration}</span>
                    </div>
                  )}
                  {detailedItem?.createdAt && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <Calendar size={12} />
                      <span>Created: {formatDate(detailedItem.createdAt)}</span>
                    </div>
                  )}
                  {detailedItem?.updatedAt &&
                    detailedItem?.updatedAt !== detailedItem?.createdAt && (
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: textMuted }}
                      >
                        <Clock size={12} />
                        <span>
                          Updated: {formatDate(detailedItem.updatedAt)}
                        </span>
                      </div>
                    )}
                  {detailedItem?.author && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <User size={12} />
                      <span>By: {detailedItem.author}</span>
                    </div>
                  )}
                  {detailedItem?.views !== undefined && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <Eye size={12} />
                      <span>{detailedItem.views.toLocaleString()} views</span>
                    </div>
                  )}
                  {detailedItem?.downloads !== undefined && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: textMuted }}
                    >
                      <Download size={12} />
                      <span>
                        {detailedItem.downloads.toLocaleString()} downloads
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {detailedItem?.tags && detailedItem.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {detailedItem.tags
                        .slice(0, 5)
                        .map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `${activeGradient}15`,
                              color: '#4f6ef7',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      {detailedItem.tags.length > 5 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: inputBg, color: textMuted }}
                        >
                          +{detailedItem.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Simple close button */}
              <div className="p-3 border-t" style={{ borderColor: cardBorder }}>
                <button
                  onClick={onClose}
                  className="w-full py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${cardBorder}`,
                    color: textMuted,
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
