// src/app/admin/content/surveys/create/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  SurveyForm,
  EMPTY_SURVEY_FORM,
  type SurveyFormValues,
} from '@/components/admin/content/SurveyForm';

export default function CreateSurveyPage() {
  const router = useRouter();

  const handleSubmit = async (values: SurveyFormValues) => {
    const { questions, ...surveyFields } = values;

    const createRes = await fetch('/api/content/surveys', {
      method: 'POST',
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
        questionsCount: questions.length,
      }),
    });
    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create survey');
    }
    const { survey } = await createRes.json();

    const questionsRes = await fetch(
      `/api/content/surveys/${survey.id}/questions`,
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
      throw new Error(data.error || 'Survey created, but saving questions failed');
    }

    router.push('/admin/content/surveys');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Add Survey
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Create a new survey for users to complete and earn from
        </p>
      </div>
      <SurveyForm
        initialValues={EMPTY_SURVEY_FORM}
        submitLabel="Create Survey"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
