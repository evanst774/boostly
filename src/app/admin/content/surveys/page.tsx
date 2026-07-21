// src/app/admin/content/surveys/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface SurveySummary {
  id: string;
  title: string;
  brand: string;
  currentParticipants: number;
  maxParticipants: number | null;
  rewardAmount: number;
  status: string;
}

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content/surveys');
      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/content/surveys/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteTarget(null);
      await fetchSurveys();
    } catch (error) {
      console.error('Failed to delete survey:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            Surveys
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all surveys on the platform
          </p>
        </div>
        <Link
          href="/admin/content/surveys/create"
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-sm font-bold hover:bg-[#7C3AED] transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/25"
        >
          <Plus size={18} />
          Add Survey
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center text-white text-2xl flex-shrink-0">
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    {survey.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {survey.brand}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                      <Users size={12} />
                      {survey.currentParticipants || 0}/
                      {survey.maxParticipants || '∞'}
                    </span>
                    <span className="text-xs font-bold text-[#8B5CF6] bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 px-2 py-0.5 rounded-full">
                      +{survey.rewardAmount} RWF
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-semibold px-3 py-1 rounded-full',
                      survey.status === 'ACTIVE'
                        ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                        : survey.status === 'DRAFT'
                          ? 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]'
                          : 'bg-[#FEF2F2] dark:bg-[#EF4444]/20 text-[#EF4444] dark:text-[#F87171]',
                    )}
                  >
                    {survey.status}
                  </span>
                  <Link
                    href={`/admin/content/surveys/${survey.id}/edit`}
                    className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                  >
                    <Edit2
                      size={16}
                      className="text-[#64748B] dark:text-[#94A3B8]"
                    />
                  </Link>
                  <button
                    onClick={() =>
                      setDeleteTarget({ id: survey.id, title: survey.title })
                    }
                    className="p-2 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors"
                  >
                    <Trash2 size={16} className="text-[#EF4444]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Survey"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
