// src/modules/content/services/videos/playlists.service.ts
import {
  videoPlaylistsRepository,
  videosRepository,
} from '../../repositories/videos';
import { getCurrentUser } from '@/lib/auth/session.server';

export class VideoPlaylistsService {
  async createPlaylist(
    name: string,
    description?: string,
    isPublic: boolean = true,
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const playlist = await videoPlaylistsRepository.create({
      name,
      description,
      createdBy: user.id,
      isPublic,
      featured: false,
      views: 0,
    });

    return playlist;
  }

  async getPlaylist(id: string) {
    return await videoPlaylistsRepository.getByIdWithVideos(id);
  }

  async getUserPlaylists(userId?: string) {
    const user = userId ? await getCurrentUser() : null;
    if (userId && !user) throw new Error('Unauthorized');
    return await videoPlaylistsRepository.getUserPlaylists(userId || user!.id);
  }

  async getFeaturedPlaylists(limit?: number) {
    return await videoPlaylistsRepository.getFeaturedPlaylists(limit);
  }

  async updatePlaylist(
    id: string,
    data: Partial<{ name: string; description: string; isPublic: boolean }>,
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const playlist = await videoPlaylistsRepository.getById(id);
    if (!playlist) throw new Error('Playlist not found');
    if (playlist.createdBy !== user.id)
      throw new Error('Unauthorized to update this playlist');

    const updated = await videoPlaylistsRepository.update(id, data);
    return updated;
  }

  async deletePlaylist(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const playlist = await videoPlaylistsRepository.getById(id);
    if (!playlist) throw new Error('Playlist not found');
    if (playlist.createdBy !== user.id)
      throw new Error('Unauthorized to delete this playlist');

    await videoPlaylistsRepository.delete(id);
  }

  async addVideoToPlaylist(playlistId: string, videoId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const playlist = await videoPlaylistsRepository.getById(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    if (playlist.createdBy !== user.id)
      throw new Error('Unauthorized to modify this playlist');

    const video = await videosRepository.getById(videoId);
    if (!video) throw new Error('Video not found');

    const count =
      await videoPlaylistsRepository.getPlaylistVideoCount(playlistId);
    return await videoPlaylistsRepository.addVideoToPlaylist(
      playlistId,
      videoId,
      count,
    );
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const playlist = await videoPlaylistsRepository.getById(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    if (playlist.createdBy !== user.id)
      throw new Error('Unauthorized to modify this playlist');

    await videoPlaylistsRepository.removeVideoFromPlaylist(playlistId, videoId);
  }

  async reorderPlaylistVideos(
    playlistId: string,
    videoOrders: { videoId: string; order: number }[],
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const playlist = await videoPlaylistsRepository.getById(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    if (playlist.createdBy !== user.id)
      throw new Error('Unauthorized to modify this playlist');

    await videoPlaylistsRepository.reorderPlaylistVideos(
      playlistId,
      videoOrders,
    );
  }
}

export const videoPlaylistsService = new VideoPlaylistsService();
