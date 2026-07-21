// src/components/admin/content/SurveyForm.tsx
'use client';

import { useState } from 'react';
import { Save, Loader2, AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SurveyQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'rating'
  | 'likert'
  | 'text';

export interface SurveyQuestionDraft {
  question: string;
  description: string;
  type: SurveyQuestionType;
  options: string[];
  required: boolean;
}

export interface SurveyFormValues {
  title: string;
  description: string;
  brand: string;
  brandLogo: string;
  category: string;
  estimatedTime: number;
  rewardAmount: number;
  maxParticipants: number | '';
  isSponsored: boolean;
  sponsorName: string;
  sponsorLogo: string;
  sponsorWebsite: string;
  questions: SurveyQuestionDraft[];
}

export const EMPTY_QUESTION: SurveyQuestionDraft = {
  question: '',
  description: '',
  type: 'single_choice',
  options: [''],
  required: true,
};

export const EMPTY_SURVEY_FORM: SurveyFormValues = {
  title: '',
  description: '',
  brand: '',
  brandLogo: '',
  category: 'TECHNOLOGY',
  estimatedTime: 5,
  rewardAmount: 200,
  maxParticipants: '',
  isSponsored: false,
  sponsorName: '',
  sponsorLogo: '',
  sponsorWebsite: '',
  questions: [{ ...EMPTY_QUESTION }],
};

const CATEGORIES = [
  'TECHNOLOGY',
  'SHOPPING',
  'FINANCE',
  'HEALTHCARE',
  'EDUCATION',
  'ENTERTAINMENT',
  'LIFESTYLE',
  'TELECOMMUNICATIONS',
  'RETAIL',
  'BANKING',
];

const QUESTION_TYPES: SurveyQuestionType[] = [
  'single_choice',
  'multiple_choice',
  'rating',
  'likert',
  'text',
];

const inputClass =
  'w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white';
const labelClass =
  'block text-sm font-medium text-[#0F172A] dark:text-white mb-1';

interface SurveyFormProps {
  initialValues: SurveyFormValues;
  submitLabel: string;
  onSubmit: (values: SurveyFormValues) => Promise<void>;
}

export function SurveyForm({
  initialValues,
  submitLabel,
  onSubmit,
}: SurveyFormProps) {
  const [form, setForm] = useState<SurveyFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SurveyFormValues>(
    field: K,
    value: SurveyFormValues[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const setQuestion = (index: number, patch: Partial<SurveyQuestionDraft>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }));
  };

  const addQuestion = () =>
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...EMPTY_QUESTION }],
    }));

  const removeQuestion = (index: number) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));

  const setOption = (qIndex: number, oIndex: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q,
      ),
    }));
  };

  const addOption = (qIndex: number) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q,
      ),
    }));

  const removeOption = (qIndex: number, oIndex: number) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.filter((_, j) => j !== oIndex) }
          : q,
      ),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (form.questions.length === 0) {
        throw new Error('Add at least one question');
      }
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Title</label>
            <input
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Brand</label>
            <input
              required
              className={inputClass}
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={cn(inputClass, 'resize-none h-20')}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className={labelClass}>Category</label>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Reward (RWF)</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.rewardAmount}
              onChange={(e) => set('rewardAmount', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Est. Time (min)</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.estimatedTime}
              onChange={(e) => set('estimatedTime', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Max Participants</label>
            <input
              type="number"
              min={1}
              placeholder="Unlimited"
              className={inputClass}
              value={form.maxParticipants}
              onChange={(e) =>
                set(
                  'maxParticipants',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('isSponsored', !form.isSponsored)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              form.isSponsored ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]',
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                form.isSponsored ? 'right-0.5' : 'left-0.5',
              )}
            />
          </button>
          <span className="text-sm font-medium text-[#0F172A] dark:text-white">
            Sponsored
          </span>
        </div>

        {form.isSponsored && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Sponsor Name</label>
              <input
                className={inputClass}
                value={form.sponsorName}
                onChange={(e) => set('sponsorName', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Sponsor Logo URL</label>
              <input
                className={inputClass}
                value={form.sponsorLogo}
                onChange={(e) => set('sponsorLogo', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Sponsor Website</label>
              <input
                className={inputClass}
                value={form.sponsorWebsite}
                onChange={(e) => set('sponsorWebsite', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Questions ({form.questions.length})
          </h3>
          <button
            type="button"
            onClick={addQuestion}
            className="px-3 py-1.5 rounded-lg bg-[#F5F3FF] dark:bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-bold flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Question
          </button>
        </div>

        {form.questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="p-4 rounded-xl border border-[#F1F5F9] dark:border-[#334155] space-y-3"
          >
            <div className="flex items-start gap-2">
              <GripVertical
                size={16}
                className="mt-3 text-[#94A3B8] flex-shrink-0"
              />
              <div className="flex-1 space-y-3">
                <input
                  required
                  placeholder={`Question ${qIndex + 1}`}
                  className={inputClass}
                  value={q.question}
                  onChange={(e) =>
                    setQuestion(qIndex, { question: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className={inputClass}
                    value={q.type}
                    onChange={(e) =>
                      setQuestion(qIndex, {
                        type: e.target.value as SurveyQuestionType,
                      })
                    }
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 px-4 text-sm text-[#0F172A] dark:text-white">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) =>
                        setQuestion(qIndex, { required: e.target.checked })
                      }
                    />
                    Required
                  </label>
                </div>

                {(q.type === 'single_choice' ||
                  q.type === 'multiple_choice' ||
                  q.type === 'likert') && (
                  <div className="space-y-2">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          placeholder={`Option ${oIndex + 1}`}
                          className={inputClass}
                          value={opt}
                          onChange={(e) =>
                            setOption(qIndex, oIndex, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="p-2 text-[#EF4444]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-xs font-semibold text-[#2563EB]"
                    >
                      + Add option
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="p-2 text-[#EF4444] flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl flex items-center gap-2 text-sm bg-[#FEF2F2] text-[#EF4444] dark:bg-[#EF4444]/20">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
