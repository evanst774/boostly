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
  type SubmitSurveyInput, onlyProvided } from '../../validation';
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
import { getUserDailyLimits, getUserPlan } from '@/modules/rewards/plan-limits';
import { canUsePlan, PLAN_LOCKED_MESSAGE } from '@/modules/content/plan-access';
import { issueTaskToken, elapsedSinceTaskStart } from '@/lib/task-token';


/** A user-facing survey problem, mapped to an HTTP status by the routes. */
export class SurveyTaskError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** At least 3 seconds per question, minimum 8 seconds. */
function minSurveySeconds(questionCount: number) {
  return Math.max(8, questionCount * 3);
}

/** Returns a problem description, or null when the answer is acceptable. */
function validateAnswer(
  q: Pick<SurveyQuestion, 'type' | 'options' | 'required'>,
  answer: string | string[] | undefined,
): string | null {
  const empty =
    answer === undefined ||
    (Array.isArray(answer) ? answer.length === 0 : answer.trim() === '');
  if (empty) return q.required ? 'Please answer every question' : null;

  const options = q.options ?? [];
  switch (q.type) {
    case 'rating': {
      const n = Number(answer);
      return Number.isInteger(n) && n >= 1 && n <= 10 ? null : 'Pick a rating from 1 to 10';
    }
    case 'text': {
      const text = Array.isArray(answer) ? answer.join(' ') : answer;
      return text.trim().length >= 2 && text.length <= 1000 ? null : 'Write a short answer';
    }
    case 'multiple_choice': {
      const picks = Array.isArray(answer) ? answer : [answer];
      return options.length === 0 || picks.every((p) => options.includes(p))
        ? null
        : 'Choose from the listed options';
    }
    default: // single_choice, likert
      if (Array.isArray(answer)) return 'Choose one option';
      return options.length === 0 || options.includes(answer) ? null : 'Choose from the listed options';
  }
}

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

    // Only the fields that were sent (no defaults sneaking in on edits).
    const validated = onlyProvided(updateSurveySchema.parse(input), input);
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

  // ============================================
  // USER-FACING: list, start, submit
  // ============================================

  /**
   * Active surveys for the current user, each flagged `completed` when they
   * have already answered it (surveys pay once per user), plus quota stats.
   */
  async listForUser(filters: { category?: string; search?: string } = {}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const plan = await getUserPlan(user.id);
    const [active, responses, limits, doneToday, earnings] = await Promise.all([
      surveysRepository.getActiveSurveys(plan.tier),
      surveyResponsesRepository.getUserResponses(user.id),
      getUserDailyLimits(user.id),
      rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.SURVEY),
      rewardsService.getEarningsByType(user.id),
    ]);

    const completedIds = new Set(responses.map((r) => r.surveyId));
    const search = filters.search?.trim().toLowerCase();
    const category = filters.category?.trim().toUpperCase();

    const surveys = active
      .filter((sv) => !category || (sv.category ?? '').toUpperCase() === category)
      .filter(
        (sv) =>
          !search ||
          sv.title.toLowerCase().includes(search) ||
          (sv.brand ?? '').toLowerCase().includes(search),
      )
      .map((sv) => ({ ...sv, completed: completedIds.has(sv.id) }));

    const totalEarned =
      earnings.find((e) => e.type === RewardTypeEnum.SURVEY)?.total ?? 0;

    return {
      surveys,
      totalPages: 1,
      stats: {
        totalEarned,
        completed: completedIds.size,
        available: surveys.filter((sv) => !sv.completed).length,
        doneToday,
        dailyLimit: limits.maxDailySurveys,
        remainingToday: Math.max(0, limits.maxDailySurveys - doneToday),
      },
    };
  }

  /**
   * Questions for a survey the user is about to take, plus a signed start
   * token so the server can enforce a minimum answering time on submit.
   */
  async startSurvey(surveyId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const survey = await surveysRepository.getById(surveyId);
    if (!survey || survey.status !== SurveyStatusEnum.ACTIVE) {
      throw new SurveyTaskError(404, 'NOT_AVAILABLE', 'This survey is no longer available.');
    }
    if (survey.endsAt && survey.endsAt <= new Date().toISOString()) {
      throw new SurveyTaskError(404, 'NOT_AVAILABLE', 'This survey has ended.');
    }
    if (!canUsePlan(survey.allowedPlanTiers, (await getUserPlan(user.id)).tier)) {
      throw new SurveyTaskError(403, 'PLAN_LOCKED', PLAN_LOCKED_MESSAGE);
    }
    if (await surveyResponsesRepository.getByUserAndSurvey(user.id, surveyId)) {
      throw new SurveyTaskError(409, 'ALREADY_COMPLETED', 'You have already completed this survey.');
    }

    const questions = await surveyQuestionsRepository.getBySurveyId(surveyId);
    if (questions.length === 0) {
      throw new SurveyTaskError(404, 'NOT_AVAILABLE', 'This survey has no questions yet.');
    }

    return {
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        description: q.description,
        type: q.type,
        options: q.options ?? [],
        required: q.required,
        order: q.order,
      })),
      startToken: issueTaskToken(user.id, 'survey', surveyId),
      minSeconds: minSurveySeconds(questions.length),
    };
  }

  async submitSurvey(input: SubmitSurveyInput & { startToken?: string }) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const validated = submitSurveySchema.parse(input);

    const survey = await surveysRepository.getById(validated.surveyId);
    if (!survey || survey.status !== SurveyStatusEnum.ACTIVE) {
      throw new SurveyTaskError(404, 'NOT_AVAILABLE', 'This survey is no longer available.');
    }
    if (!canUsePlan(survey.allowedPlanTiers, (await getUserPlan(user.id)).tier)) {
      throw new SurveyTaskError(403, 'PLAN_LOCKED', PLAN_LOCKED_MESSAGE);
    }

    // Surveys pay once per user (unique index on userId + surveyId).
    if (await surveyResponsesRepository.getByUserAndSurvey(user.id, validated.surveyId)) {
      throw new SurveyTaskError(409, 'ALREADY_COMPLETED', 'You have already completed this survey.');
    }

    const questions = await surveyQuestionsRepository.getBySurveyId(validated.surveyId);

    // Anti-cheat: time measured from when the server handed out the questions.
    const elapsed = elapsedSinceTaskStart(input.startToken, user.id, 'survey', survey.id);
    if (elapsed === null) {
      throw new SurveyTaskError(400, 'RESTART', 'Your survey session expired. Please start the survey again.');
    }
    const minSeconds = minSurveySeconds(questions.length);
    if (elapsed < minSeconds * 1000) {
      throw new SurveyTaskError(400, 'TOO_FAST', 'Please take a moment to read and answer each question.');
    }

    // Validate every answer against its question.
    const byId = new Map(validated.answers.map((a) => [a.questionId, a.answer]));
    const formattedAnswers: { questionId: string; answer: string | string[] }[] = [];
    for (const q of questions) {
      const answer = byId.get(q.id);
      const problem = validateAnswer(q, answer);
      if (problem) {
        throw new SurveyTaskError(400, 'INVALID_ANSWER', `${problem} (“${q.question}”)`);
      }
      if (answer !== undefined) formattedAnswers.push({ questionId: q.id, answer });
    }

    // Per-plan cap on rewarded surveys per day. Checked before recording so a
    // capped user can come back tomorrow and still earn for this survey.
    const limits = await getUserDailyLimits(user.id);
    const todaySurveyRewards = await rewardsService.getTodayRewardCount(user.id, RewardTypeEnum.SURVEY);
    if (todaySurveyRewards >= limits.maxDailySurveys) {
      throw new SurveyTaskError(
        429,
        'DAILY_LIMIT_REACHED',
        `You've reached today's survey limit (${limits.maxDailySurveys}). Come back tomorrow or upgrade your plan for more.`,
      );
    }

    // Pay first, atomically capped by the plan's daily quota. If the cap is
    // hit, nothing is recorded, so the user can still take this survey (and
    // get paid) tomorrow. Scope 'once' makes a double submit pay only once.
    const credit = await rewardsService.createReward({
      userId: user.id,
      type: RewardTypeEnum.SURVEY,
      baseAmount: survey.rewardAmount,
      description: `Survey reward: ${survey.title}`,
      sourceId: survey.id,
      sourceType: 'survey',
      scope: 'once',
      dailyCap: limits.maxDailySurveys,
      budget: { table: 'surveys', id: survey.id },
    });

    if (!credit.credited && credit.reason === 'BUDGET_EXHAUSTED') {
      throw new SurveyTaskError(
        429,
        'BUDGET_EXHAUSTED',
        "This survey's sponsored rewards are used up. Your answers weren't saved, so you can try another survey.",
      );
    }

    if (!credit.credited && credit.reason === 'DAILY_EARNINGS_MAX') {
      throw new SurveyTaskError(429, 'DAILY_EARNINGS_MAX', "You've reached today's earning maximum for your plan. Come back tomorrow, or upgrade to earn more each day. Your answers weren't saved.");
    }

    if (!credit.credited && credit.reason === 'DAILY_LIMIT') {
      throw new SurveyTaskError(
        429,
        'DAILY_LIMIT_REACHED',
        `You've reached today's survey limit (${limits.maxDailySurveys}). Come back tomorrow or upgrade your plan for more.`,
      );
    }

    let response;
    try {
      response = await surveyResponsesRepository.create({
        surveyId: validated.surveyId,
        userId: user.id,
        answers: formattedAnswers,
        completed: true,
        completedAt: new Date().toISOString(),
        rewardClaimed: credit.credited,
        rewardAmount: credit.credited ? credit.amount : 0,
      });
    } catch {
      // Lost a double-submit race: the other request recorded the response
      // (and the 'once' reward key guarantees it was paid only once).
      throw new SurveyTaskError(409, 'ALREADY_COMPLETED', 'You have already completed this survey.');
    }

    await surveysRepository.incrementParticipants(validated.surveyId);

    if (!credit.credited) {
      return { response, rewardEarned: 0, code: credit.reason };
    }

    return { response, rewardEarned: credit.amount, newBalance: credit.newBalance };
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
