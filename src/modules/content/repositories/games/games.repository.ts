// src/modules/content/repositories/games/games.repository.ts
import { db } from '@/lib/db';
import {
  games,
  GameStatusEnum,
  type Game,
  type NewGame,
  type GameCategory,
  type GameStatus,
} from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export class GamesRepository {
  async create(data: NewGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return game;
  }

  async getById(id: string): Promise<Game | undefined> {
    return await db.query.games.findFirst({
      where: eq(games.id, id),
    });
  }

  async getActiveGames(): Promise<Game[]> {
    return await db.query.games.findMany({
      where: eq(games.status, GameStatusEnum.ACTIVE),
      orderBy: [desc(games.createdAt)],
    });
  }

  async getGames(filters: {
    category?: GameCategory;
    status?: GameStatus;
    page?: number;
    limit?: number;
  }): Promise<{ games: Game[]; total: number }> {
    const conditions = [];
    if (filters.category) conditions.push(eq(games.category, filters.category));
    if (filters.status) conditions.push(eq(games.status, filters.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = ((filters.page || 1) - 1) * (filters.limit || 20);

    const items = await db.query.games.findMany({
      where: whereClause,
      limit: filters.limit || 20,
      offset: offset,
      orderBy: [desc(games.createdAt)],
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(whereClause);

    return { games: items, total: Number(totalResult[0]?.count ?? 0) };
  }

  async update(id: string, data: Partial<NewGame>): Promise<Game | undefined> {
    const [updated] = await db
      .update(games)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(games.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  async incrementPlays(id: string): Promise<void> {
    await db
      .update(games)
      .set({
        totalPlays: sql`${games.totalPlays} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(games.id, id));
  }

  async incrementPlayers(id: string): Promise<void> {
    await db
      .update(games)
      .set({
        totalPlayers: sql`${games.totalPlayers} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(games.id, id));
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    totalPlays: number;
  }> {
    const [total, active, plays] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(games),
      db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(eq(games.status, GameStatusEnum.ACTIVE)),
      db.select({ sum: sql<number>`sum(${games.totalPlays})` }).from(games),
    ]);
    return {
      total: Number(total[0]?.count ?? 0),
      active: Number(active[0]?.count ?? 0),
      totalPlays: Number(plays[0]?.sum ?? 0),
    };
  }
}

export const gamesRepository = new GamesRepository();
