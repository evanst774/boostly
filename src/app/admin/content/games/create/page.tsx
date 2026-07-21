// src/app/admin/content/games/create/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  GameForm,
  EMPTY_GAME_FORM,
  type GameFormValues,
} from '@/components/admin/content/GameForm';

export default function CreateGamePage() {
  const router = useRouter();

  const handleSubmit = async (values: GameFormValues) => {
    const payload = {
      ...values,
      thumbnailUrl: values.thumbnailUrl || undefined,
      sponsorLogo: values.isSponsored ? values.sponsorLogo || undefined : undefined,
      sponsorWebsite: values.isSponsored
        ? values.sponsorWebsite || undefined
        : undefined,
      sponsorName: values.isSponsored ? values.sponsorName || undefined : undefined,
    };
    const res = await fetch('/api/content/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create game');
    }
    router.push('/admin/content/games');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Add Game
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Create a new game for users to play and earn from
        </p>
      </div>
      <GameForm
        initialValues={EMPTY_GAME_FORM}
        submitLabel="Create Game"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
