// src/modules/content/services/videos/engagements.service.ts
import {
  videoEngagementsRepository,
  videosRepository,
} from '../../repositories/videos';
import { getCurrentUser } from '@/lib/auth/session.server';

export class VideoEngagementsService {
  async toggleEngagement(
    videoId: string,
    type: 'like' | 'dislike' | 'share' | 'save',
  ) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video) throw new Error('Video not found');

    const result = await videoEngagementsRepository.toggleEngagement(
      user.id,
      videoId,
      type,
    );

    if (type === 'share' && result.action === 'added') {
      await videosRepository.updateEngagementMetrics(videoId);
    }

    return result;
  }

  async getVideoEngagementStats(videoId: string) {
    return await videoEngagementsRepository.getEngagementStats(videoId);
  }

  async getUserVideoEngagements(videoId: string) {
    const user = await getCurrentUser();
    if (!user) return null;

    const engagements = await videoEngagementsRepository.getByUserAndVideo(
      user.id,
      videoId,
    );

    return {
      liked: engagements.some((e) => e.type === 'like'),
      disliked: engagements.some((e) => e.type === 'dislike'),
      saved: engagements.some((e) => e.type === 'save'),
      shared: engagements.some((e) => e.type === 'share'),
    };
  }
}

export const videoEngagementsService = new VideoEngagementsService();
