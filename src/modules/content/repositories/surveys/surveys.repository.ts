// src/modules/content/repositories/surveys/surveys.repository.ts
import { db } from '@/lib/db';
import {
  surveys,
  SurveyStatusEnum,
  type Survey,
  type NewSurvey,
  type SurveyStatus,
} from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export class SurveysRepository {
  async create(data: NewSurvey): Promise<Survey> {
    const [survey] = await db
      .insert(surveys)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return survey;
  }

  async getById(id: string): Promise<Survey | undefined> {
    return await db.query.surveys.findFirst({
      where: eq(surveys.id, id),
      with: { questions: true },
    });
  }

  async getActiveSurveys(): Promise<Survey[]> {
    const now = new Date().toISOString();
    return await db.query.surveys.findMany({
      where: and(
        eq(surveys.status, SurveyStatusEnum.ACTIVE),
        sql`${surveys.endsAt} IS NULL OR ${surveys.endsAt} > ${now}`,
      ),
      orderBy: [desc(surveys.createdAt)],
    });
  }

  async getSurveys(filters: {
    brand?: string;
    status?: SurveyStatus;
    page?: number;
    limit?: number;
  }): Promise<{ surveys: Survey[]; total: number }> {
    const conditions = [];
    if (filters.brand) conditions.push(eq(surveys.brand, filters.brand));
    if (filters.status) conditions.push(eq(surveys.status, filters.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = ((filters.page || 1) - 1) * (filters.limit || 20);

    const items = await db.query.surveys.findMany({
      where: whereClause,
      with: { questions: true },
      limit: filters.limit || 20,
      offset: offset,
      orderBy: [desc(surveys.createdAt)],
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveys)
      .where(whereClause);

    return { surveys: items, total: Number(totalResult[0]?.count ?? 0) };
  }

  async update(id: string, data: Partial<NewSurvey>): Promise<Survey | undefined> {
    const [updated] = await db
      .update(surveys)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(surveys.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  async incrementParticipants(id: string): Promise<void> {
    await db
      .update(surveys)
      .set({
        currentParticipants: sql`${surveys.currentParticipants} + 1`,
        updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      })
      .where(eq(surveys.id, id));
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    totalResponses: number;
  }> {
    const [total, active, responses] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(surveys),
      db.select({ count: sql<number>`count(*)` }).from(surveys).where(eq(surveys.status, SurveyStatusEnum.ACTIVE)),
      db.select({ sum: sql<number>`sum(${surveys.currentParticipants})` }).from(surveys),
    ]);
    return {
      total: Number(total[0]?.count ?? 0),
      active: Number(active[0]?.count ?? 0),
      totalResponses: Number(responses[0]?.sum ?? 0),
    };
  }

  async getSurveyResponseRate(surveyId: string): Promise<number> {
    const survey = await this.getById(surveyId);
    if (!survey || !survey.maxParticipants || survey.maxParticipants === 0) {
      return 0;
    }
    return (survey.currentParticipants / survey.maxParticipants) * 100;
  }
}

export const surveysRepository = new SurveysRepository();