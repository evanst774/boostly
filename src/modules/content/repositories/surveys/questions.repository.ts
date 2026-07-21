// src/modules/content/repositories/surveys/questions.repository.ts
import { db } from '@/lib/db';
import {
  surveyQuestions,
  type SurveyQuestion,
  type NewSurveyQuestion,
} from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export class SurveyQuestionsRepository {
  async create(data: NewSurveyQuestion): Promise<SurveyQuestion> {
    const [question] = await db
      .insert(surveyQuestions)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning();
    return question;
  }

  async createMany(questions: NewSurveyQuestion[]): Promise<SurveyQuestion[]> {
    const values = questions.map((q) => ({
      id: crypto.randomUUID(),
      ...q,
    }));
    const inserted = await db
      .insert(surveyQuestions)
      .values(values)
      .returning();
    return inserted;
  }

  async getById(id: string): Promise<SurveyQuestion | undefined> {
    return await db.query.surveyQuestions.findFirst({
      where: eq(surveyQuestions.id, id),
    });
  }

  async getBySurveyId(surveyId: string): Promise<SurveyQuestion[]> {
    return await db.query.surveyQuestions.findMany({
      where: eq(surveyQuestions.surveyId, surveyId),
      orderBy: [surveyQuestions.order],
    });
  }

  async update(
    id: string,
    data: Partial<NewSurveyQuestion>,
  ): Promise<SurveyQuestion | undefined> {
    const [updated] = await db
      .update(surveyQuestions)
      .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(surveyQuestions.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
  }

  async deleteBySurveyId(surveyId: string): Promise<void> {
    await db
      .delete(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId));
  }

  async getQuestionCount(surveyId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId));
    return Number(result[0]?.count ?? 0);
  }

  async reorderQuestions(
    surveyId: string,
    questionOrders: { id: string; order: number }[],
  ): Promise<void> {
    for (const item of questionOrders) {
      await db
        .update(surveyQuestions)
        .set({ order: item.order })
        .where(eq(surveyQuestions.id, item.id));
    }
  }
}

export const surveyQuestionsRepository = new SurveyQuestionsRepository();
