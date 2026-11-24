// src/app/admin/content/videos/create/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  VideoForm,
  EMPTY_VIDEO_FORM,
  type VideoFormValues,
} from '@/components/admin/content/VideoForm';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'ACTIVE', label: 'Active' },
];

export default function CreateVideoPage() {
  const router = useRouter();

  const handleSubmit = async (formData: VideoFormValues) => {
    const response = await fetch('/api/content/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create video');
    }

    setTimeout(() => router.push('/admin/content/videos'), 1500);
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/content/videos')}
          aria-label="Back to videos"
          className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors touch-min-target"
        >
          <ArrowLeft size={20} className="text-[#64748B] dark:text-[#94A3B8]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Add New Video
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Create and publish new video content
          </p>
        </div>
      </div>

      <VideoForm
        initialValues={EMPTY_VIDEO_FORM}
        statusOptions={STATUS_OPTIONS}
        submitLabel="Create Video"
        submittingLabel="Creating..."
        successMessage="Video created successfully!"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/content/videos')}
      />
    </div>
  );
}
