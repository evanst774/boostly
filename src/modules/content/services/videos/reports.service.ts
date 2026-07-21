// src/modules/content/services/videos/reports.service.ts
import {
  videoReportsRepository,
  videosRepository,
} from '../../repositories/videos';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '../../permissions';
import { VideoStatusEnum } from '@/lib/db/schema';
import { createAuditLog } from '@/lib/audit';

export class VideoReportsService {
  async reportVideo(videoId: string, reason: string, description?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const video = await videosRepository.getById(videoId);
    if (!video) throw new Error('Video not found');

    const existingReports = await videoReportsRepository.getByVideoId(videoId);
    const userReport = existingReports.find((r) => r.userId === user.id);
    if (userReport) throw new Error('You have already reported this video');

    const report = await videoReportsRepository.create({
      videoId,
      userId: user.id,
      reason,
      description,
      status: 'pending',
    });

    return report;
  }

  async getVideoReports(videoId: string) {
    await requirePermission(ContentPermissions.VIDEOS_READ);
    return await videoReportsRepository.getByVideoId(videoId);
  }

  async getPendingReports(limit?: number) {
    await requirePermission(ContentPermissions.VIDEOS_READ);
    return await videoReportsRepository.getPendingReports(limit);
  }

  async resolveReport(
    reportId: string,
    status: 'reviewed' | 'dismissed' | 'action_taken',
    action?: string,
  ) {
    await requirePermission(ContentPermissions.VIDEOS_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const report = await videoReportsRepository.getById(reportId);
    if (!report) throw new Error('Report not found');

    const updated = await videoReportsRepository.updateStatus(
      reportId,
      status,
      user.id,
    );

    if (status === 'action_taken' && report.videoId) {
      await videosRepository.update(report.videoId, {
        status: VideoStatusEnum.INACTIVE,
        updatedBy: user.id,
      });
    }

    await createAuditLog({
      userId: user.id,
      action: 'REPORT_RESOLVED',
      entityType: 'report',
      entityId: reportId,
      oldData: report,
      newData: updated,
      metadata: { action },
    });

    return updated;
  }

  async getReportStats() {
    await requirePermission(ContentPermissions.VIDEOS_READ);
    return await videoReportsRepository.getReportStats();
  }

  async getPopularTags(limit?: number) {
    // This is from tags repository - imported via videosRepository
    const { videoTagsRepository } =
      await import('../../repositories/videos/tags.repository');
    return await videoTagsRepository.getPopularTags(limit);
  }

  async getVideosByTag(tag: string) {
    const { videoTagsRepository } =
      await import('../../repositories/videos/tags.repository');
    return await videoTagsRepository.getVideosByTag(tag);
  }
}

export const videoReportsService = new VideoReportsService();
