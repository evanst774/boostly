// src/modules/content/services/videos/comments.service.ts
import {
  videoCommentsRepository,
  videosRepository,
} from '../../repositories/videos';
import { getCurrentUser } from '@/lib/auth/session.server';

export class VideoCommentsService {
  async createComment(videoId: string, content: string, parentId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video) throw new Error('Video not found');

    if (parentId) {
      const parent = await videoCommentsRepository.getById(parentId);
      if (!parent) throw new Error('Parent comment not found');
      if (parent.videoId !== videoId)
        throw new Error('Parent comment does not belong to this video');
    }

    const comment = await videoCommentsRepository.create({
      videoId,
      userId: user.id,
      parentId: parentId || null,
      content,
    });

    return comment;
  }

  async getVideoComments(videoId: string, limit?: number) {
    return await videoCommentsRepository.getByVideoId(videoId, limit);
  }

  async getCommentReplies(commentId: string, limit?: number) {
    return await videoCommentsRepository.getReplies(commentId, limit);
  }

  async updateComment(commentId: string, content: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const comment = await videoCommentsRepository.getById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== user.id)
      throw new Error('Unauthorized to edit this comment');

    const updated = await videoCommentsRepository.update(commentId, {
      content,
    });
    return updated;
  }

  async deleteComment(commentId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const comment = await videoCommentsRepository.getById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== user.id)
      throw new Error('Unauthorized to delete this comment');

    await videoCommentsRepository.delete(commentId);
  }

  async toggleCommentLike(commentId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const comment = await videoCommentsRepository.getById(commentId);
    if (!comment) throw new Error('Comment not found');

    // For now, simple toggle. In production, use a comment_likes table
    const existing = await this.getUserCommentLike(user.id, commentId);

    if (existing) {
      await videoCommentsRepository.decrementLikes(commentId);
      await this.removeUserCommentLike(user.id, commentId);
      return { action: 'unliked' };
    } else {
      await videoCommentsRepository.incrementLikes(commentId);
      await this.addUserCommentLike(user.id, commentId);
      return { action: 'liked' };
    }
  }

  // Helper methods (in production, implement with a comment_likes table)
  private async getUserCommentLike(
    userId: string,
    commentId: string,
  ): Promise<boolean> {
    void userId;
    void commentId;
    return false;
  }

  private async addUserCommentLike(
    userId: string,
    commentId: string,
  ): Promise<void> {
    void userId;
    void commentId;
  }

  private async removeUserCommentLike(
    userId: string,
    commentId: string,
  ): Promise<void> {
    void userId;
    void commentId;
  }
}

export const videoCommentsService = new VideoCommentsService();
