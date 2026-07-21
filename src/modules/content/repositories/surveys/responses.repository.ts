// src/modules/content/repositories/surveys/responses.repository.ts
import { db } from '@/lib/db';
import {
  surveyResponses,
  type SurveyResponse,
  type NewSurveyResponse,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export class SurveyResponsesRepository {
  async create(data: NewSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db
      .insert(surveyResponses)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return response;
  }

  async getById(id: string): Promise<SurveyResponse | undefined> {
    return await db.query.surveyResponses.findFirst({
      where: eq(surveyResponses.id, id),
      with: { survey: true },
    });
  }

  async getByUserAndSurvey(
    userId: string,
    surveyId: string,
  ): Promise<SurveyResponse | undefined> {
    return await db.query.surveyResponses.findFirst({
      where: and(
        eq(surveyResponses.userId, userId),
        eq(surveyResponses.surveyId, surveyId),
      ),
    });
  }

  async getUserResponses(userId: string): Promise<SurveyResponse[]> {
    return await db.query.surveyResponses.findMany({
      where: eq(surveyResponses.userId, userId),
      with: { survey: true },
      orderBy: [desc(surveyResponses.createdAt)],
    });
  }

  async update(
    id: string,
    data: Partial<NewSurveyResponse>,
  ): Promise<SurveyResponse | undefined> {
    const [updated] = await db
      .update(surveyResponses)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(surveyResponses.id, id))
      .returning();
    return updated;
  }

  async getDailyEarnings(userId: string, date: string): Promise<number> {
    const result = await db
      .select({ sum: sql<number>`sum(${surveyResponses.rewardAmount})` })
      .from(surveyResponses)
      .where(
        and(
          eq(surveyResponses.userId, userId),
          eq(surveyResponses.rewardClaimed, true),
          eq(surveyResponses.completed, true),
          sql`date(${surveyResponses.completedAt}) = ${date}`,
        ),
      );
    return Number(result[0]?.sum ?? 0);
  }

  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    return await db.query.surveyResponses.findMany({
      where: eq(surveyResponses.surveyId, surveyId),
      with: { user: true },
      orderBy: [desc(surveyResponses.createdAt)],
    });
  }

  async getResponseCount(surveyId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId));
    return Number(result[0]?.count ?? 0);
  }

  async getUserResponseCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveyResponses)
      .where(eq(surveyResponses.userId, userId));
    return Number(result[0]?.count ?? 0);
  }

  async getResponseRate(surveyId: string): Promise<number> {
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId));
    return Number(total[0]?.count ?? 0);
  }
}

export const surveyResponsesRepository = new SurveyResponsesRepository();
