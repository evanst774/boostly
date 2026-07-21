// src/modules/content/repositories/videos/playlists.repository.ts
import { db } from '@/lib/db';
import {
  videoPlaylists,
  playlistVideos,
  type VideoPlaylist,
  type NewVideoPlaylist,
  type PlaylistVideo,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export class VideoPlaylistsRepository {
  async create(data: NewVideoPlaylist): Promise<VideoPlaylist> {
    const [playlist] = await db
      .insert(videoPlaylists)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return playlist;
  }

  async getById(id: string): Promise<VideoPlaylist | undefined> {
    return await db.query.videoPlaylists.findFirst({
      where: eq(videoPlaylists.id, id),
      with: { videos: true },
    });
  }

  async getByIdWithVideos(id: string): Promise<VideoPlaylist | undefined> {
    return await db.query.videoPlaylists.findFirst({
      where: eq(videoPlaylists.id, id),
      with: {
        videos: {
          with: { video: true },
          orderBy: [playlistVideos.order],
        },
      },
    });
  }

  async getUserPlaylists(userId: string): Promise<VideoPlaylist[]> {
    return await db.query.videoPlaylists.findMany({
      where: and(
        eq(videoPlaylists.createdBy, userId),
        eq(videoPlaylists.isPublic, true),
      ),
      orderBy: [desc(videoPlaylists.createdAt)],
    });
  }

  async getFeaturedPlaylists(limit: number = 10): Promise<VideoPlaylist[]> {
    return await db.query.videoPlaylists.findMany({
      where: and(
        eq(videoPlaylists.featured, true),
        eq(videoPlaylists.isPublic, true),
      ),
      orderBy: [desc(videoPlaylists.createdAt)],
      limit: limit,
    });
  }

  async getPublicPlaylists(limit?: number): Promise<VideoPlaylist[]> {
    return await db.query.videoPlaylists.findMany({
      where: eq(videoPlaylists.isPublic, true),
      orderBy: [desc(videoPlaylists.createdAt)],
      limit: limit,
    });
  }

  async update(
    id: string,
    data: Partial<NewVideoPlaylist>,
  ): Promise<VideoPlaylist | undefined> {
    const [updated] = await db
      .update(videoPlaylists)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(videoPlaylists.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(videoPlaylists).where(eq(videoPlaylists.id, id));
  }

  async incrementViews(id: string): Promise<void> {
    await db
      .update(videoPlaylists)
      .set({
        views: sql`${videoPlaylists.views} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(videoPlaylists.id, id));
  }

  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    order?: number,
  ): Promise<PlaylistVideo> {
    const [entry] = await db
      .insert(playlistVideos)
      .values({
        id: crypto.randomUUID(),
        playlistId,
        videoId,
        order: order ?? 0,
      })
      .returning();
    return entry;
  }

  async removeVideoFromPlaylist(
    playlistId: string,
    videoId: string,
  ): Promise<void> {
    await db
      .delete(playlistVideos)
      .where(
        and(
          eq(playlistVideos.playlistId, playlistId),
          eq(playlistVideos.videoId, videoId),
        ),
      );
  }

  async reorderPlaylistVideos(
    playlistId: string,
    videoOrders: { videoId: string; order: number }[],
  ): Promise<void> {
    for (const item of videoOrders) {
      await db
        .update(playlistVideos)
        .set({ order: item.order })
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, item.videoId),
          ),
        );
    }
  }

  async getPlaylistVideoCount(playlistId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(playlistVideos)
      .where(eq(playlistVideos.playlistId, playlistId));
    return Number(result[0]?.count ?? 0);
  }
}

export const videoPlaylistsRepository = new VideoPlaylistsRepository();
