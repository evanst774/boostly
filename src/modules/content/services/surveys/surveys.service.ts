// src/modules/content/services/surveys/surveys.service.ts
import {
  surveysRepository,
  surveyQuestionsRepository,
  surveyResponsesRepository,
} from '../../repositories/surveys';
import {
  createSurveySchema,
  updateSurveySchema,
  submitSurveySchema,
  type CreateSurveyInput,
  type UpdateSurveyInput,
  type SubmitSurveyInput,
} from '../../validation';
import { createAuditLog } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { ContentPermissions } from '../../permissions';
import {
  SurveyStatus,
  SurveyStatusEnum,
  type NewSurveyQuestion,
  type SurveyQuestion,
} from '@/lib/db/schema';
import { rewardsService } from '@/modules/rewards/service';
import { RewardTypeEnum } from '@/lib/db/schema/rewards';
import { getUserDailyLimits } from '@/modules/rewards/plan-limits';
import { db } from '@/lib/db';
import { surveyResponses } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export class SurveysService {
  async createSurvey(input: CreateSurveyInput) {
    await requirePermission(ContentPermissions.SURVEYS_CREATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = createSurveySchema.parse(input);
    const survey = await surveysRepository.create({
      ...validated,
      createdBy: user.id,
      status: SurveyStatusEnum.DRAFT,
    });

    await createAuditLog({
      userId: user.id,
      action: 'SURVEY_CREATED',
      entityType: 'survey',
      entityId: survey.id,
      newData: survey,
    });

    return survey;
  }

  async getSurvey(id: string) {
    await requirePermission(ContentPermissions.SURVEYS_READ);
    const survey = await surveysRepository.getById(id);
    if (!survey) throw new Error('Survey not found');
    return survey;
  }

  async getActiveSurveys() {
    return await surveysRepository.getActiveSurveys();
  }

  async getSurveys(filters: {
    brand?: string;
    category?: string;
    status?: SurveyStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    await requirePermission(ContentPermissions.SURVEYS_READ);
    return await surveysRepository.getSurveys(filters);
  }

  async updateSurvey(id: string, input: UpdateSurveyInput) {
    await requirePermission(ContentPermissions.SURVEYS_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await surveysRepository.getById(id);
    if (!existing) throw new Error('Survey not found');

    const validated = updateSurveySchema.parse(input);
    const updated = await surveysRepository.update(id, validated);

    await createAuditLog({
      userId: user.id,
      action: 'SURVEY_UPDATED',
      entityType: 'survey',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  /**
   * Replaces a survey's entire question list. Simplest correct model for an
   * admin question builder: the UI always sends the full ordered list, and
   * this swaps it in atomically-enough for admin use (delete-all then
   * recreate) rather than trying to diff individual question edits/reorders.
   */
  async setQuestions(
    surveyId: string,
    questions: Array<
      Omit<NewSurveyQuestion, 'id' | 'surveyId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<SurveyQuestion[]> {
    await requirePermission(ContentPermissions.SURVEYS_UPDATE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await surveysRepository.getById(surveyId);
    if (!existing) throw new Error('Survey not found');

    await surveyQuestionsRepository.deleteBySurveyId(surveyId);

    const created = questions.length
      ? await surveyQuestionsRepository.createMany(
          questions.map((q, index) => ({
            ...q,
            surveyId,
            order: q.order ?? index,
          })),
        )
      : [];

    await surveysRepository.update(surveyId, {
      questionsCount: created.length,
    });

    await createAuditLog({
      userId: user.id,
      action: 'SURVEY_UPDATED',
      entityType: 'survey',
      entityId: surveyId,
      newData: { questionsCount: created.length },
    });

    return created;
  }

  async publishSurvey(id: string) {
    await requirePermission(ContentPermissions.SURVEYS_PUBLISH);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await surveysRepository.getById(id);
    if (!existing) throw new Error('Survey not found');

    const updated = await surveysRepository.update(id, {
      status: SurveyStatusEnum.ACTIVE,
      startsAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    });

    await createAuditLog({
      userId: user.id,
      action: 'SURVEY_PUBLISHED',
      entityType: 'survey',
      entityId: id,
      oldData: existing,
      newData: updated,
    });

    return updated;
  }

  async deleteSurvey(id: string) {
    await requirePermission(ContentPermissions.SURVEYS_DELETE);
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const existing = await surveysRepository.getById(id);
    if (!existing) throw new Error('Survey not found');

    await surveysRepository.delete(id);

    await createAuditLog({
      userId: user.id,
      action: 'SURVEY_DELETED',
      entityType: 'survey',
      entityId: id,
      oldData: existing,
    });
  }

  // Check if user already completed this survey today
  private async hasUserCompletedToday(
    surveyId: string,
    userId: string,
  ): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query.surveyResponses.findFirst({
      where: and(
        eq(surveyResponses.surveyId, surveyId),
        eq(surveyResponses.userId, userId),
        sql`date(${surveyResponses.createdAt}) = ${today}`,
      ),
    });
    return !!result;
  }

  async submitSurvey(input: SubmitSurveyInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = submitSurveySchema.parse(input);

    const survey = await surveysRepository.getById(validated.surveyId);
    if (!survey) throw new Error('Survey not found');
    if (survey.status !== SurveyStatusEnum.ACTIVE)
      throw new Error('Survey not available');

    // Check if user already completed today
    const alreadyCompleted = await this.hasUserCompletedToday(
      validated.surveyId,
      user.id,
    );
    if (alreadyCompleted) {
      return {
        response: null,
        rewardEarned: 0,
        message:
          'You have already completed this survey today. Come back tomorrow!',
        code: 'DAILY_LIMIT_REACHED',
      };
    }

    // FLAGGED, NOT CHANGED: this check looks for ANY prior response ever
    // (no date filter), and throws a hard error if one exists. That directly
    // contradicts hasUserCompletedToday()/DAILY_LIMIT_REACHED above, which
    // imply this survey is daily-repeatable. As written, only ONE response
    // to a given survey can ever exist per user — after the first
    // submission, every future attempt hits this block, on any day,
    // forever, and the "come back tomorrow" branch above is effectively
    // dead code from day two onward.
    //
    // I'm leaving this exactly as-is rather than guessing which behavior is
    // intended, since surveyResponsesRepository / the surveyResponses
    // schema aren't visible to me here — if surveyResponses has a unique
    // (userId, surveyId) constraint at the DB level (mirroring video_watches'
    // pattern), then "one response ever" is the real intended design and
    // the daily-repeat framing above is leftover copy-paste from
    // videos.service.ts that should probably be removed instead. Worth a
    // deliberate decision, not a silent guess: either (a) surveys are
    // one-time-ever, and hasUserCompletedToday/DAILY_LIMIT_REACHED should
    // come out, or (b) surveys are meant to be daily-repeatable like videos,
    // and this block needs to become an update-in-place (like video_watches)
    // scoped to today rather than an unconditional block on any history.
    const existing = await surveyResponsesRepository.getByUserAndSurvey(
      user.id,
      validated.surveyId,
    );
    if (existing) throw new Error('You have already completed this survey');

    // Per-plan cap on how many DIFFERENT surveys can earn a reward per day.
    const limits = await getUserDailyLimits(user.id);
    const todaySurveyRewards = await rewardsService.getTodayRewardCount(
      user.id,
      RewardTypeEnum.SURVEY,
    );
    if (todaySurveyRewards >= limits.maxDailySurveys) {
      return {
        response: null,
        rewardEarned: 0,
        message: `You've reached your plan's daily survey limit (${limits.maxDailySurveys}). Upgrade your plan to complete more surveys per day.`,
        code: 'DAILY_LIMIT_REACHED',
      };
    }

    const questions = await surveyQuestionsRepository.getBySurveyId(
      validated.surveyId,
    );
    if (validated.answers.length !== questions.length) {
      throw new Error('Invalid number of answers');
    }

    // Format answers with questionId
    const formattedAnswers = validated.answers.map((answer, index) => ({
      questionId: questions[index].id,
      answer: answer.answer,
    }));

    const response = await surveyResponsesRepository.create({
      surveyId: validated.surveyId,
      userId: user.id,
      answers: formattedAnswers,
      completed: true,
      completedAt: new Date().toISOString(),
    });

    await surveysRepository.incrementParticipants(validated.surveyId);

    // FIX: `amount` -> `baseAmount`, plus a required `scope`. This call
    // previously didn't compile against CreateRewardInput at all. Scope is
    // `'once'` to match the EFFECTIVE current behavior above (the hard
    // `existing` check means a given user can only ever submit this survey
    // one time) — see the flagged comment above if that turns out not to be
    // the intended design; if surveys become genuinely daily-repeatable,
    // this scope should change to today's date, matching videos.service.ts.
    const credit = await rewardsService.createReward({
      userId: user.id,
      type: RewardTypeEnum.SURVEY,
      baseAmount: survey.rewardAmount,
      description: `Survey reward: ${survey.title}`,
      sourceId: survey.id,
      sourceType: 'survey',
      scope: 'once',
      metadata: { responseId: response.id },
    });

    if (!credit.credited) {
      // Response was recorded, but this exact reward was already paid out
      // (e.g. a retried request). Don't mark rewardClaimed again or report
      // an amount that wasn't actually credited.
      return {
        response,
        rewardEarned: 0,
        message: 'Response recorded, but this survey was already rewarded.',
        code: 'ALREADY_CREDITED',
      };
    }

    await surveyResponsesRepository.update(response.id, {
      rewardClaimed: true,
      // Store what was ACTUALLY credited (post-multiplier), not the raw
      // survey.rewardAmount — these can diverge once badge/subscription
      // boosts are wired up in rewardsService.getEarningsMultiplier().
      rewardAmount: credit.amount,
    });

    return { response, rewardEarned: credit.amount };
  }

  async getSurveyStats() {
    await requirePermission(ContentPermissions.SURVEYS_READ);
    return await surveysRepository.getStats();
  }

  async getSurveyResponseRate(surveyId: string) {
    return await surveysRepository.getSurveyResponseRate(surveyId);
  }

  async getSurveyResponses(surveyId: string) {
    await requirePermission(ContentPermissions.SURVEYS_READ);
    return await surveyResponsesRepository.getSurveyResponses(surveyId);
  }

  async getUserSurveyResponses() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    return await surveyResponsesRepository.getUserResponses(user.id);
  }
}

export const surveysService = new SurveysService();
