// src/app/admin/content/games/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface GameSummary {
  id: string;
  name: string;
  category: string;
  totalPlays: number;
  baseReward: number;
  status: string;
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content/games');
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/content/games/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteTarget(null);
      await fetchGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
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
            Games
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all games on the platform
          </p>
        </div>
        <Link
          href="/admin/content/games/create"
          className="px-4 py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-bold hover:bg-[#16A34A] transition-colors flex items-center gap-2 shadow-lg shadow-green-500/25"
        >
          <Plus size={18} />
          Add Game
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
          {games.map((game) => (
            <div
              key={game.id}
              className="p-4 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white text-2xl flex-shrink-0">
                  🎮
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    {game.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {game.category}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      👾 {game.totalPlays || 0} plays
                    </span>
                    <span className="text-xs font-bold text-[#22C55E] bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-2 py-0.5 rounded-full">
                      +{game.baseReward} RWF
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-semibold px-3 py-1 rounded-full',
                      game.status === 'ACTIVE'
                        ? 'bg-[#F0FDF4] dark:bg-[#22C55E]/20 text-[#22C55E] dark:text-[#4ADE80]'
                        : 'bg-[#FFFBEB] dark:bg-[#F59E0B]/20 text-[#F59E0B] dark:text-[#FBBF24]',
                    )}
                  >
                    {game.status}
                  </span>
                  <Link
                    href={`/admin/content/games/${game.id}/edit`}
                    className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
                  >
                    <Edit2
                      size={16}
                      className="text-[#64748B] dark:text-[#94A3B8]"
                    />
                  </Link>
                  <button
                    onClick={() =>
                      setDeleteTarget({ id: game.id, name: game.name })
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
        title="Delete Game"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
