// src/app/admin/content/surveys/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  SurveyForm,
  EMPTY_SURVEY_FORM,
  type SurveyFormValues,
} from '@/components/admin/content/SurveyForm';
import type { SurveyQuestion } from '@/lib/db/schema';

export default function EditSurveyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<SurveyFormValues | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/content/surveys/${params.id}`);
        if (!res.ok) throw new Error('Failed to load survey');
        const { survey } = await res.json();
        setInitialValues({
          ...EMPTY_SURVEY_FORM,
          ...survey,
          brandLogo: survey.brandLogo ?? '',
          maxParticipants: survey.maxParticipants ?? '',
          sponsorName: survey.sponsorName ?? '',
          sponsorLogo: survey.sponsorLogo ?? '',
          sponsorWebsite: survey.sponsorWebsite ?? '',
          questions:
            (survey.questions as SurveyQuestion[] | undefined ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((q) => ({
                question: q.question,
                description: q.description ?? '',
                type: q.type,
                options: q.options?.length ? q.options : [''],
                required: q.required,
              })) || [],
        });
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load survey',
        );
      }
    })();
  }, [params.id]);

  const handleSubmit = async (values: SurveyFormValues) => {
    const { questions, ...surveyFields } = values;

    const updateRes = await fetch(`/api/content/surveys/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...surveyFields,
        brandLogo: surveyFields.brandLogo || undefined,
        maxParticipants:
          surveyFields.maxParticipants === ''
            ? undefined
            : surveyFields.maxParticipants,
        sponsorLogo: surveyFields.isSponsored
          ? surveyFields.sponsorLogo || undefined
          : undefined,
        sponsorWebsite: surveyFields.isSponsored
          ? surveyFields.sponsorWebsite || undefined
          : undefined,
        sponsorName: surveyFields.isSponsored
          ? surveyFields.sponsorName || undefined
          : undefined,
      }),
    });
    if (!updateRes.ok) {
      const data = await updateRes.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update survey');
    }

    const questionsRes = await fetch(
      `/api/content/surveys/${params.id}/questions`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map((q, index) => ({
            question: q.question,
            description: q.description || undefined,
            type: q.type,
            options: q.type === 'text' ? [] : q.options.filter(Boolean),
            required: q.required,
            order: index,
          })),
        }),
      },
    );
    if (!questionsRes.ok) {
      const data = await questionsRes.json().catch(() => ({}));
      throw new Error(data.error || 'Survey updated, but saving questions failed');
    }

    router.push('/admin/content/surveys');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Edit Survey
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Update this survey&apos;s details and questions
        </p>
      </div>
      {loadError ? (
        <div className="p-4 rounded-xl bg-[#FEF2F2] text-[#EF4444] text-sm">
          {loadError}
        </div>
      ) : !initialValues ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#2563EB]" />
        </div>
      ) : (
        <SurveyForm
          initialValues={initialValues}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
