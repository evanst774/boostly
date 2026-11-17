// src/hooks/useSurveys.ts
import { useCallback, useEffect, useState } from 'react';

interface UseSurveysProps {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SurveySummary {
  id: string;
  title: string;
  description?: string | null;
  brand: string;
  brandLogo?: string | null;
  category: string;
  questionsCount: number;
  estimatedTime: number;
  rewardAmount: number;
  currentParticipants: number;
  maxParticipants?: number | null;
  status: string;
  /** True when this user already answered it (surveys pay once). */
  completed?: boolean;
}

/** A question as served by GET /api/content/surveys/[id]/questions. */
export interface SurveyQuestionItem {
  id: string;
  question: string;
  description?: string | null;
  type: 'single_choice' | 'multiple_choice' | 'rating' | 'likert' | 'text';
  options: string[];
  required: boolean;
  order: number;
}

export interface SurveyStats {
  totalEarned: number;
  completed: number;
  available: number;
  doneToday: number;
  dailyLimit: number;
  remainingToday: number;
}

interface SurveysApiResponse {
  surveys: SurveySummary[];
  totalPages: number;
  stats: SurveyStats;
}

export function useSurveys({
  search,
  category,
  status = 'active',
  page = 1,
  limit = 20,
}: UseSurveysProps = {}) {
  const [data, setData] = useState<SurveysApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/content/surveys?${params}`, {
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load surveys');
      setData(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch surveys'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
