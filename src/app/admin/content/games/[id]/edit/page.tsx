// src/app/admin/content/games/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  GameForm,
  EMPTY_GAME_FORM,
  type GameFormValues,
} from '@/components/admin/content/GameForm';

export default function EditGamePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<GameFormValues | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/content/games/${params.id}`);
        if (!res.ok) throw new Error('Failed to load game');
        const { game } = await res.json();
        setInitialValues({
          ...EMPTY_GAME_FORM,
          ...game,
          thumbnailUrl: game.thumbnailUrl ?? '',
          sponsorName: game.sponsorName ?? '',
          sponsorLogo: game.sponsorLogo ?? '',
          sponsorWebsite: game.sponsorWebsite ?? '',
        });
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load game',
        );
      }
    })();
  }, [params.id]);

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
    const res = await fetch(`/api/content/games/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update game');
    }
    router.push('/admin/content/games');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Edit Game
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Update this game&apos;s details and rewards
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
        <GameForm
          initialValues={initialValues}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
