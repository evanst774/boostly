// src/components/ui/FileDropZone.tsx
'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  Loader2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
}

interface FileDropZoneProps {
  onFileUpload: (file: File) => Promise<void>;
  onFileRemove?: () => void;
  isUploading?: boolean;
  isDeleting?: boolean;
  accept?: string;
  maxSize?: number;
  folder?: string;
  label?: string;
  hint?: string;
  uploadedFile?: UploadedFile | null;
  className?: string;
  disabled?: boolean; // Add disabled prop
}

export function FileDropZone({
  onFileUpload,
  onFileRemove,
  isUploading = false,
  isDeleting = false,
  accept = '.jpg,.jpeg,.png,.pdf',
  maxSize = 10 * 1024 * 1024,
  label = 'Upload File',
  hint = 'JPG, PNG or PDF',
  uploadedFile,
  className,
  disabled = false,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        return; // Validation handled by parent
      }
      onFileUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      const hasFiles = Array.from(e.dataTransfer.types).includes('Files');
      if (hasFiles && !isUploading) {
        setIsDragging(true);
      }
    },
    [isUploading, disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!dropZoneRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragging && !isUploading) {
        setIsDragging(true);
      }
    },
    [isDragging, isUploading, disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setIsDragging(false);

      if (isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.size > maxSize) return;
        onFileUpload(file);
      }
      e.dataTransfer.clearData();
    },
    [isUploading, maxSize, onFileUpload, disabled],
  );

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />;
    }
    return <FileText className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
        {label}
      </label>

      {uploadedFile ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-green-400">
                File Uploaded
              </div>
              <div className="text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                {getFileIcon(uploadedFile.name)}
                {uploadedFile.name} ({formatSize(uploadedFile.size)})
              </div>
            </div>
            <button
              type="button"
              onClick={onFileRemove}
              disabled={isDeleting || disabled}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 disabled:opacity-50"
              title="Remove file"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() =>
            !isUploading && !disabled && fileInputRef.current?.click()
          }
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
            disabled && 'opacity-50 cursor-not-allowed',
            isDragging && !disabled
              ? 'border-blue-400 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/10'
              : 'border-border-subtle hover:border-primary-500/30 hover:bg-white/5',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading || disabled}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
              <p className="text-sm text-gray-400">Uploading...</p>
            </div>
          ) : isDragging && !disabled ? (
            <>
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-blue-400 font-medium">
                Drop file here
              </p>
              <p className="text-xs text-blue-400/60 mt-1">Release to upload</p>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Click or drag to upload</p>
              <p className="text-xs text-gray-600 mt-1">
                {hint} (max {formatSize(maxSize)})
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
