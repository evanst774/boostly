// src/components/earn/GameCategoryIcon.tsx
// Icon for a game, chosen by its category. A game's stored `icon` (an emoji
// in the database) is deliberately not rendered.
import {
  Brain,
  CarFront,
  ChessKnight,
  Compass,
  Gamepad2,
  Puzzle,
  Smile,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { GameCategory } from '@/lib/db/schema/games';

export const GAME_CATEGORY_ICONS: Record<GameCategory, LucideIcon> = {
  PUZZLE: Puzzle,
  ACTION: Zap,
  CASUAL: Smile,
  STRATEGY: ChessKnight,
  QUIZ: Brain,
  RACING: CarFront,
  SPORTS: Trophy,
  ADVENTURE: Compass,
};

export function getGameCategoryIcon(category?: string | null): LucideIcon {
  return GAME_CATEGORY_ICONS[category as GameCategory] ?? Gamepad2;
}

export function GameCategoryIcon({
  category,
  className,
  size,
}: {
  category?: string | null;
  className?: string;
  size?: number;
}) {
  const Icon = getGameCategoryIcon(category);
  return <Icon className={className} size={size} />;
}
