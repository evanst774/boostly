// src/components/admin/content/GameForm.tsx
'use client';

import { useState } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GameFormValues {
  name: string;
  description: string;
  category: string;
  icon: string;
  thumbnailUrl: string;
  gameUrl: string;
  provider: string;
  orientation: string;
  baseReward: number;
  maxReward: number;
  maxPlaysPerDay: number;
  minPlayDuration: number;
  maxRewardedSecondsPerDay: number;
  difficulty: number;
  isSponsored: boolean;
  sponsorName: string;
  sponsorLogo: string;
  sponsorWebsite: string;
}

export const EMPTY_GAME_FORM: GameFormValues = {
  name: '',
  description: '',
  category: 'PUZZLE',
  icon: '🎮',
  thumbnailUrl: '',
  gameUrl: '',
  provider: 'SELF_HOSTED',
  orientation: 'BOTH',
  baseReward: 50,
  maxReward: 150,
  maxPlaysPerDay: 10,
  minPlayDuration: 30,
  maxRewardedSecondsPerDay: 600,
  difficulty: 1,
  isSponsored: false,
  sponsorName: '',
  sponsorLogo: '',
  sponsorWebsite: '',
};

const CATEGORIES = [
  'PUZZLE',
  'ACTION',
  'CASUAL',
  'STRATEGY',
  'QUIZ',
  'RACING',
  'SPORTS',
  'ADVENTURE',
];
const PROVIDERS = ['SELF_HOSTED', 'GAMEPIX', 'GAMEMONETIZE'];
const ORIENTATIONS = ['PORTRAIT', 'LANDSCAPE', 'BOTH'];

const inputClass =
  'w-full px-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white';
const labelClass =
  'block text-sm font-medium text-[#0F172A] dark:text-white mb-1';

interface GameFormProps {
  initialValues: GameFormValues;
  submitLabel: string;
  onSubmit: (values: GameFormValues) => Promise<void>;
}

export function GameForm({
  initialValues,
  submitLabel,
  onSubmit,
}: GameFormProps) {
  const [form, setForm] = useState<GameFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof GameFormValues>(
    field: K,
    value: GameFormValues[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Name</label>
          <input
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Icon (emoji)</label>
          <input
            className={inputClass}
            value={form.icon}
            onChange={(e) => set('icon', e.target.value)}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <label className={labelClass}>Provider</label>
          <select
            className={inputClass}
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Orientation</label>
          <select
            className={inputClass}
            value={form.orientation}
            onChange={(e) => set('orientation', e.target.value)}
          >
            {ORIENTATIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Thumbnail URL</label>
          <input
            className={inputClass}
            value={form.thumbnailUrl}
            onChange={(e) => set('thumbnailUrl', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Game URL</label>
          <input
            required
            className={inputClass}
            value={form.gameUrl}
            onChange={(e) => set('gameUrl', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <label className={labelClass}>Base Reward (RWF)</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.baseReward}
            onChange={(e) => set('baseReward', Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Max Reward (RWF)</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.maxReward}
            onChange={(e) => set('maxReward', Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Max Plays/Day</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.maxPlaysPerDay}
            onChange={(e) => set('maxPlaysPerDay', Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Difficulty (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            className={inputClass}
            value={form.difficulty}
            onChange={(e) => set('difficulty', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Min Play Duration (seconds)</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.minPlayDuration}
            onChange={(e) =>
              set('minPlayDuration', Number(e.target.value))
            }
          />
        </div>
        <div>
          <label className={labelClass}>Max Rewarded Seconds/Day</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.maxRewardedSecondsPerDay}
            onChange={(e) =>
              set('maxRewardedSecondsPerDay', Number(e.target.value))
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
