// scripts/import-games-catalog.ts
//
// Imports games from the Boostly Games platform catalog (games.boostly.buzz)
// into this app's `games` table, so they can be played and paid in Boostly.
//
//   dry run:  npx dotenv -e .env.production -- tsx scripts/import-games-catalog.ts
//   apply:    npx dotenv -e .env.production -- tsx scripts/import-games-catalog.ts --apply
//   other catalog (e.g. local dev):  ... --catalog=http://localhost:3100/api/v1/games.json
//
// - Matches existing rows by URL (https://games.boostly.buzz/<slug>/...), so
//   re-running is safe and old /<slug>/index.html links are upgraded.
// - Existing rows: only name, description, thumbnail, URL and orientation are
//   refreshed. Reward settings, budgets and status stay as the admin set them.
// - New rows start with modest rewards (admin can change them in Admin > Games).
// - Embed URLs get ?embed=boostly, which turns ads off inside the game: paid
//   play must never show ads.
import { eq, like } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { games, type GameCategory, type GameOrientation } from '../src/lib/db/schema';

interface CatalogGame {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  orientation: 'any' | 'portrait' | 'landscape';
  embedUrl: string;
  thumbnailUrl: string;
}

const CATEGORY: Record<string, GameCategory> = {
  Puzzle: 'PUZZLE',
  Runner: 'RACING',
  Arcade: 'CASUAL',
  Action: 'ACTION',
  Board: 'STRATEGY',
  Trivia: 'QUIZ',
};

const ORIENTATION: Record<CatalogGame['orientation'], GameOrientation> = {
  any: 'BOTH',
  portrait: 'PORTRAIT',
  landscape: 'LANDSCAPE',
};

const GLYPH: Record<string, string> = { Puzzle: '🧩', Runner: '🏃', Arcade: '🕹️', Action: '⚔️', Board: '♟️', Trivia: '❓' };

async function main() {
  const apply = process.argv.includes('--apply');
  const catalogArg = process.argv.find((a) => a.startsWith('--catalog='));
  const catalogUrl = catalogArg?.split('=')[1] ?? 'https://games.boostly.buzz/api/v1/games.json';

  console.log(apply ? 'APPLYING catalog import' : 'DRY RUN (add --apply to write)');
  console.log('catalog:', catalogUrl);

  const res = await fetch(catalogUrl);
  if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
  const catalog = (await res.json()) as { games: CatalogGame[] };

  let created = 0;
  let updated = 0;
  for (const g of catalog.games) {
    const base = g.embedUrl.replace(/\/$/, '');
    const gameUrl = `${base}/?embed=boostly`;
    const existing = await db.query.games.findFirst({ where: like(games.gameUrl, `${base}/%`) });
    const content = {
      name: g.title,
      description: g.description,
      thumbnailUrl: g.thumbnailUrl,
      gameUrl,
      orientation: ORIENTATION[g.orientation] ?? 'BOTH',
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      updated += 1;
      console.log(`update  ${g.slug.padEnd(18)} ${existing.name} -> ${g.title}`);
      if (apply) await db.update(games).set(content).where(eq(games.id, existing.id));
    } else {
      created += 1;
      console.log(`create  ${g.slug.padEnd(18)} ${g.title} (${g.category})`);
      if (apply) {
        await db.insert(games).values({
          ...content,
          category: CATEGORY[g.category] ?? 'CASUAL',
          icon: GLYPH[g.category] ?? '🎮',
          provider: 'SELF_HOSTED',
          baseReward: 15,
          maxReward: 30,
          minPlayDuration: 60,
          maxPlaysPerDay: 3,
          difficulty: 2,
          status: 'ACTIVE',
        });
      }
    }
  }
  console.log(`${created} new, ${updated} updated.${apply ? '' : ' Nothing written.'}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
