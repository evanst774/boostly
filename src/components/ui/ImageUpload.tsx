// components/ui/ImageUpload.tsx
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFileUpload } from '@/hooks/useFileUpload';
import Image from 'next/image';
import {
  Loader2,
  X,
  Upload,
  Eye,
  Maximize2,
  Trash2,
  ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as Dialog from '@radix-ui/react-dialog';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string, key: string) => void;
  onRemove?: () => void;
  folder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  imageKey?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  folder = 'events',
  className = '',
  label = 'Event Image',
  required = false,
  imageKey: initialImageKey,
}) => {
  const { dark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { uploadFile, isUploading, deleteFile, uploadProgress } =
    useFileUpload();
  const [preview, setPreview] = useState(value || '');
  const [currentImageKey, setCurrentImageKey] = useState(initialImageKey || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  useEffect(() => {
    setCurrentImageKey(initialImageKey || '');
  }, [initialImageKey]);

  // Theme-based colors
  const textPrimary = dark ? '#e8eaf2' : '#1f2937';
  const textMuted = dark ? '#8b92a5' : '#64748b';
  const inputBg = dark ? '#0f1117' : '#f8fafc';
  const borderColor = dark ? '#374151' : '#d1d5db';
  const cardBg = dark ? '#1e2333' : '#ffffff';
  const cardBorder = dark ? '#252c3d' : '#e2e8f0';
  const dropBg = dark ? 'rgba(79,110,247,0.1)' : 'rgba(79,110,247,0.05)';
  const dropBorder = dark ? '#4f6ef7' : '#4f6ef7';

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // Fire-and-forget old image deletion in background
      const oldKey = currentImageKey;
      if (oldKey) {
        deleteFile(oldKey).then((deleted) => {
          if (!deleted) {
            console.warn('Failed to remove old image from R2:', oldKey);
          }
        });
      }

      const result = await uploadFile(file, { folder });
      if (result) {
        setPreview(result.url);
        setCurrentImageKey(result.key);
        onChange(result.url, result.key);
      } else {
        // Revert preview on failure
        setPreview(value || '');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [currentImageKey, deleteFile, folder, onChange, uploadFile, value],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  // Improved Drag and Drop handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if the dragged item is actually a file
      const hasFiles = Array.from(e.dataTransfer.types).includes('Files');
      if (hasFiles && !isUploading) {
        setIsDragging(true);
      }
    },
    [isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only reset if we're leaving the drop zone, not entering a child
    const relatedTarget = e.relatedTarget as Node;
    if (!dropZoneRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // Set drop effect to copy
      e.dataTransfer.dropEffect = 'copy';

      // Highlight drop zone
      if (!isDragging && !isUploading) {
        setIsDragging(true);
      }
    },
    [isDragging, isUploading],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (isUploading) {
        toast.error('Please wait for current upload to finish');
        return;
      }

      // Get files from data transfer
      const files = e.dataTransfer.files;

      if (files && files.length > 0) {
        const file = files[0];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please drop an image file');
          return;
        }

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be less than 5MB');
          return;
        }

        await processFile(file);
      }

      // Clear drag data
      e.dataTransfer.clearData();
    },
    [isUploading, processFile],
  );

  const handleRemove = async () => {
    setIsDeleting(true);
    try {
      if (currentImageKey) {
        const deleted = await deleteFile(currentImageKey);
        if (!deleted) {
          toast.error('Failed to delete image from server');
          return;
        }
      }

      setPreview('');
      setCurrentImageKey('');
      setIsPreviewOpen(false);
      if (onRemove) onRemove();
      onChange('', '');
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setIsDeleting(false);
    }
  };

  const openPreview = () => {
    if (preview && !isUploading) setIsPreviewOpen(true);
  };

  // Prevent default drag behaviors on the whole document
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent default drag behaviors on window
    window.addEventListener('dragenter', preventDefaults);
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragenter', preventDefaults);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  return (
    <>
      <div className={className}>
        <label
          className="block text-sm font-medium mb-2 transition-colors"
          style={{ color: textPrimary }}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview ? (
          <div className="relative inline-block group">
            <div className="relative w-32 h-32">
              <Image
                src={preview}
                alt="Uploaded"
                fill
                className="object-cover rounded-lg cursor-pointer"
                style={{
                  border: `1px solid ${borderColor}`,
                  backgroundColor: inputBg,
                  opacity: isUploading ? 0.6 : 1,
                }}
                onClick={openPreview}
                sizes="128px"
              />

              {!isUploading && (
                <div
                  className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={openPreview}
                >
                  <Maximize2 size={20} className="text-white" />
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-1 pointer-events-none">
                  <Loader2 size={22} className="animate-spin text-white" />
                  <span className="text-white text-xs font-semibold tabular-nums">
                    {uploadProgress < 100
                      ? `${uploadProgress}%`
                      : 'Processing…'}
                  </span>
                  <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading || isDeleting}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-40 shadow-lg z-10"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
            </button>
          </div>
        ) : (
          /* Improved Drag & Drop Zone */
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative w-32 h-32 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              isDragging ? 'scale-105' : ''
            }`}
            style={{
              borderColor: isDragging ? dropBorder : borderColor,
              backgroundColor: isDragging ? dropBg : inputBg,
              borderStyle: 'dashed',
            }}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 px-2 w-full">
                <Loader2
                  size={22}
                  className="animate-spin"
                  style={{ color: '#4f6ef7' }}
                />
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: textMuted }}
                >
                  {uploadProgress < 100 ? `${uploadProgress}%` : 'Processing…'}
                </span>
                <div className="w-3/4 h-1 bg-gray-600/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                {isDragging ? (
                  <>
                    <ImagePlus size={28} style={{ color: '#4f6ef7' }} />
                    <span
                      className="text-xs text-center font-medium"
                      style={{ color: '#4f6ef7' }}
                    >
                      Drop image here
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={24} style={{ color: textMuted }} />
                    <span
                      className="text-xs text-center"
                      style={{ color: textMuted }}
                    >
                      Click or drag image
                    </span>
                    <span
                      className="text-xs text-center"
                      style={{ color: textMuted }}
                    >
                      (Max 5MB)
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Image Preview Dialog - Fixed: Replaced img with next/image */}
      <Dialog.Root open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden z-50"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="relative flex flex-col h-full">
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: cardBorder }}
              >
                <h3
                  className="text-lg font-semibold"
                  style={{ color: textPrimary }}
                >
                  Image Preview
                </h3>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <X size={20} style={{ color: textMuted }} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                <div className="relative w-full h-full max-w-full max-h-[70vh] min-h-[300px]">
                  {preview && (
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-contain rounded-lg"
                      sizes="(max-width: 768px) 90vw, 70vw"
                    />
                  )}
                </div>
              </div>

              <div className="p-4 border-t" style={{ borderColor: cardBorder }}>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => window.open(preview, '_blank')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                    style={{ color: textMuted }}
                  >
                    <Eye size={14} />
                    Open in new tab
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    style={{ color: '#ef4444' }}
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {isDeleting ? 'Deleting…' : 'Delete image'}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
