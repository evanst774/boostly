// src/app/(dashboard)/earn/surveys/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Search,
  Clock,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
  Shield,
  CheckCircle2,
  Star,
  BarChart3,
  User,
  Calendar,
  ClipboardList,
  Coins,
  Landmark,
  PartyPopper,
  Pill,
  ShoppingCart,
  Signal,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import {
  useSurveys,
  type SurveySummary,
  type SurveyQuestionItem as SurveyQuestionRow,
} from '@/hooks/useSurveys';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { common } from '@/lib/i18n/messages/common';
import { earn } from '@/lib/i18n/messages/earn';

type EarnKey = keyof typeof earn.en;
import { motion, AnimatePresence } from 'framer-motion';


// UI category types
type UICategory =
  | 'all'
  | 'technology'
  | 'shopping'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'entertainment'
  | 'lifestyle';

const categories: {
  value: UICategory;
  label: `scat_${UICategory}`;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: 'all',
    label: 'scat_all',
    icon: <BarChart3 size={14} />,
    color: 'from-blue-500 to-purple-500',
  },
  {
    value: 'technology',
    label: 'scat_technology',
    icon: <Zap size={14} />,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    value: 'shopping',
    label: 'scat_shopping',
    icon: <Star size={14} />,
    color: 'from-amber-500 to-yellow-500',
  },
  {
    value: 'finance',
    label: 'scat_finance',
    icon: <TrendingUp size={14} />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'healthcare',
    label: 'scat_healthcare',
    icon: <Shield size={14} />,
    color: 'from-red-400 to-pink-500',
  },
  {
    value: 'education',
    label: 'scat_education',
    icon: <User size={14} />,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    value: 'entertainment',
    label: 'scat_entertainment',
    icon: <Sparkles size={14} />,
    color: 'from-pink-500 to-rose-500',
  },
  {
    value: 'lifestyle',
    label: 'scat_lifestyle',
    icon: <Calendar size={14} />,
    color: 'from-violet-500 to-purple-500',
  },
];

// Survey Card Skeleton
function SurveyCardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-[#334155] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#F1F5F9] dark:bg-[#334155] rounded w-3/4" />
          <div className="h-3 bg-[#F1F5F9] dark:bg-[#334155] rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-12" />
            <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Progress Indicator
function SurveyProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const t = useT(earn);
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
        <span>{t('progress')}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-full"
        />
      </div>
    </div>
  );
}

// Question Types
const QuestionTypes = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SINGLE_CHOICE: 'single_choice',
  RATING: 'rating',
  TEXT: 'text',
  LIKERT: 'likert',
};

function SurveyQuestion({
  question,
  index,
  selectedOption,
  onSelect,
  onNext,
  onBack,
  isFirst,
  isLast,
  isSubmitting,
}: {
  question: SurveyQuestionRow;
  index: number;
  selectedOption: string | null;
  onSelect: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting: boolean;
}) {
  const t = useT(earn);
  const tc = useT(common);
  // Determine question type based on options or default
  const type = question.type || QuestionTypes.SINGLE_CHOICE;
  const options = question.options || [];

  const renderOptions = () => {
    switch (type) {
      case QuestionTypes.RATING:
        return (
          <div className="flex gap-2 sm:gap-3 justify-center py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => onSelect(num.toString())}
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold transition-all hover:scale-110',
                  selectedOption === num.toString()
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/30'
                    : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#2563EB]/10',
                )}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case QuestionTypes.LIKERT:
        // The stored answer stays in English; only the label is translated.
        const likertOptions: { value: string; label: EarnKey }[] = [
          { value: 'Strongly Disagree', label: 'likert_strongly_disagree' },
          { value: 'Disagree', label: 'likert_disagree' },
          { value: 'Neutral', label: 'likert_neutral' },
          { value: 'Agree', label: 'likert_agree' },
          { value: 'Strongly Agree', label: 'likert_strongly_agree' },
        ];
        return (
          <div className="space-y-2">
            {likertOptions.map(({ value: option, label }) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3',
                  selectedOption === option
                    ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#2563EB]/20'
                    : 'border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedOption === option
                      ? 'border-[#2563EB] bg-[#2563EB]'
                      : 'border-[#94A3B8] dark:border-[#64748B]',
                  )}
                >
                  {selectedOption === option && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm font-medium">{t(label)}</span>
              </button>
            ))}
          </div>
        );

      case QuestionTypes.SINGLE_CHOICE:
      default:
        return (
          <div className="space-y-3">
            {options.map((option: string) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3',
                  selectedOption === option
                    ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#2563EB]/20'
                    : 'border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedOption === option
                      ? 'border-[#2563EB] bg-[#2563EB]'
                      : 'border-[#94A3B8] dark:border-[#64748B]',
                  )}
                >
                  {selectedOption === option && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm font-medium">{option}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Question Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <span className="font-semibold">{t('questionN', { n: index + 1 })}</span>
          <span>•</span>
          <span>
            {`qtype_${type}` in earn.en
              ? t(`qtype_${type}` as EarnKey)
              : type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
          {question.question}
        </h3>
        {question.description && (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {question.description}
          </p>
        )}
      </div>

      {/* Options */}
      {renderOptions()}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] dark:border-[#334155]">
        <button
          onClick={onBack}
          disabled={isFirst}
          className={cn(
            'text-sm font-medium transition-colors flex items-center gap-1',
            isFirst
              ? 'text-[#94A3B8] dark:text-[#64748B] cursor-not-allowed'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white',
          )}
        >
          <ChevronLeft size={16} />
          {tc('back')}
        </button>
        <button
          onClick={onNext}
          disabled={!selectedOption || isSubmitting}
          className={cn(
            'px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2',
            selectedOption && !isSubmitting
              ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white hover:shadow-lg hover:shadow-blue-500/30'
              : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#94A3B8] dark:text-[#64748B] cursor-not-allowed',
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('submitting')}
            </>
          ) : isLast ? (
            t('completeSurvey')
          ) : (
            <>
              {t('next')}
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// Survey Completion Screen
function SurveyComplete({
  reward,
  onClose,
}: {
  reward: number;
  onClose: () => void;
}) {
  const { formatAmount } = useSystemCurrency();
  const t = useT(earn);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center text-center py-8 space-y-6"
    >
      <div className="w-24 h-24 rounded-full bg-[#F0FDF4] dark:bg-[#22C55E]/20 border-4 border-[#22C55E] flex items-center justify-center text-5xl animate-scale-in">
        <PartyPopper size={44} className="text-[#22C55E] dark:text-[#4ADE80]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          {t('surveyComplete')}
        </h2>
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          {t('thanksOpinion')}
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#22C55E]/20 dark:to-[#16A34A]/10 rounded-2xl px-8 py-4 border border-[#BBF7D0] dark:border-[#22C55E]/30">
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          {reward > 0 ? t('addedToBalance') : t('responseRecorded')}
        </p>
        <p className="text-3xl font-extrabold text-[#22C55E]">
          {reward > 0 ? `+${formatAmount(reward)}` : t('thankYou')}
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-3 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
      >
        {t('done')}
      </button>
    </motion.div>
  );
}

export default function SurveysPage() {
  const { formatAmount } = useSystemCurrency();
  const t = useT(earn);
  const tc = useT(common);
  const [selectedCategory, setSelectedCategory] = useState<UICategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveySummary | null>(
    null,
  );
  const [isTakingSurvey, setIsTakingSurvey] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(0);
  const [page, setPage] = useState(1);
  const [allSurveys, setAllSurveys] = useState<SurveySummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [questions, setQuestions] = useState<SurveyQuestionRow[]>([]);
  const [startToken, setStartToken] = useState<string | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  // Convert UI category to schema category (simplified for now)
  const schemaCategory =
    selectedCategory === 'all' ? undefined : selectedCategory;

  const { data, isLoading, error: listError, refetch } = useSurveys({
    category: schemaCategory,
    search: searchQuery,
    page,
    limit: 20,
  });

  // Memoize surveys to prevent unnecessary re-renders
  const surveys = useMemo(() => data?.surveys || [], [data?.surveys]);
  const totalPages = data?.totalPages || 1;
  const stats = data?.stats || {
    totalEarned: 0,
    completed: 0,
    available: 0,
    doneToday: 0,
    dailyLimit: 0,
    remainingToday: 0,
  };
  const limitReached = !!data && stats.remainingToday === 0;

  // Create a stable reference for surveys using useMemo
  const stableSurveys = useMemo(() => surveys, [surveys]);

  // Update all surveys when data changes - now using stableSurveys
  useEffect(() => {
    if (page === 1) {
      setAllSurveys(stableSurveys);
    } else {
      setAllSurveys((prev) => [...prev, ...stableSurveys]);
    }
    setHasMore(page < totalPages);
    setIsLoadingMore(false);
  }, [stableSurveys, page, totalPages]);

  const handleStartSurvey = async (survey: SurveySummary) => {
    if (survey.completed || limitReached) return;
    setSelectedSurvey(survey);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setIsTakingSurvey(true);
    setIsCompleted(false);
    setRewardEarned(0);
    setQuestions([]);
    setStartToken(null);
    setSurveyError(null);
    setIsLoadingQuestions(true);
    try {
      const res = await fetch(`/api/content/surveys/${survey.id}/questions`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t('cantOpenSurvey'));
      setQuestions(json.questions || []);
      setStartToken(json.startToken || null);
    } catch (e) {
      setSurveyError(e instanceof Error ? e.message : t('cantOpenSurvey'));
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleCloseSurvey = () => {
    setIsTakingSurvey(false);
    setSelectedSurvey(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setIsCompleted(false);
    setQuestions([]);
    setStartToken(null);
    setSurveyError(null);
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const handleNextQuestion = () => {
    if (!selectedOption) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setSelectedOption(newAnswers[currentQuestion + 1] ?? null);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Submit the array we just built: `answers` state isn't updated yet.
      handleSubmitSurvey(newAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1] || null);
    }
  };

  const handleSubmitSurvey = async (finalAnswers: string[]) => {
    if (!selectedSurvey) return;
    setIsSubmitting(true);
    setSurveyError(null);
    try {
      const response = await fetch(
        `/api/content/surveys/${selectedSurvey.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startToken,
            answers: questions.map((q, index) => ({
              questionId: q.id,
              answer: finalAnswers[index] ?? '',
            })),
          }),
        },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Keep the user on the last question so they can retry (e.g. TOO_FAST).
        setSelectedOption(finalAnswers[currentQuestion] ?? null);
        throw new Error(result.error || t('submitSurveyFailed'));
      }

      setRewardEarned(result.rewardEarned || 0);
      setIsCompleted(true);
      refetch();
    } catch (error) {
      setSurveyError(
        error instanceof Error ? error.message : t('submitSurveyFailed'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (category: UICategory) => {
    setSelectedCategory(category);
    setPage(1);
    setAllSurveys([]);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setAllSurveys([]);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'MTN Rwanda': 'from-[#FCD34D] to-[#F59E0B]',
      'Bank of Kigali': 'from-[#2563EB] to-[#1D4ED8]',
      'Carrefour Rwanda': 'from-[#22C55E] to-[#16A34A]',
      RSSB: 'from-[#EC4899] to-[#BE185D]',
      'Airtel Rwanda': 'from-[#EF4444] to-[#DC2626]',
      BK: 'from-[#2563EB] to-[#1D4ED8]',
    };
    return colors[brand] || 'from-[#6B7280] to-[#4B5563]';
  };

  const getBrandIcon = (brand: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      'MTN Rwanda': Signal,
      'Bank of Kigali': Landmark,
      'Carrefour Rwanda': ShoppingCart,
      RSSB: Pill,
      'Airtel Rwanda': Smartphone,
      BK: Landmark,
    };
    return icons[brand] || ClipboardList;
  };


  return (
    <div className="space-y-5 font-outfit max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Stats */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-3 py-1.5 rounded-full flex-shrink-0">
            <Award size={14} className="text-[#F59E0B] dark:text-[#FBBF24]" />
            <span className="text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24] whitespace-nowrap">
              {data ? t('surveysLeft', { left: stats.remainingToday, limit: stats.dailyLimit }) : '…'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-3 py-1.5 rounded-full flex-shrink-0">
            <CheckCircle2
              size={14}
              className="text-[#22C55E] dark:text-[#4ADE80]"
            />
            <span className="text-xs font-bold text-[#22C55E] dark:text-[#4ADE80] whitespace-nowrap">
              {t('nCompleted', { n: stats.completed })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#F59E0B]/20 dark:to-[#FBBF24]/10 border border-[#FDE68A] dark:border-[#F59E0B]/30 p-5 sm:p-6">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-20 select-none">
          <ClipboardList className="w-20 h-20 text-[#F59E0B]" />
        </div>
        <div className="relative z-10">
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
            {t('opinionPays')}{' '}
            <Coins className="inline w-5 h-5 -mt-1 text-[#F59E0B] dark:text-[#FBBF24]" />
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            {t('opinionPaysBody')}
          </p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                {t('earnedFromSurveys')}
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-[#F59E0B]">
                {formatAmount(stats.totalEarned)}
              </p>
            </div>
            <div className="border-l border-[#FDE68A] dark:border-[#F59E0B]/30 pl-6">
              <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                {t('available')}
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-[#F59E0B]">
                {stats.available}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#64748B]"
          />
          <input
            type="text"
            placeholder={t('searchSurveys')}
            className="w-full pl-10 pr-4 py-2.5 border border-[#F1F5F9] dark:border-[#334155] rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={cn(
              'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 touch-min-target',
              selectedCategory === cat.value
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-white dark:bg-[#1E293B] border border-[#F1F5F9] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#2563EB] dark:hover:border-[#60A5FA]',
            )}
            onClick={() => handleCategoryChange(cat.value)}
          >
            {cat.icon}
            {t(cat.label)}
          </button>
        ))}
      </div>

      {limitReached && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] dark:bg-[#F59E0B]/10 dark:border-[#F59E0B]/30 p-3 text-sm text-[#92400E] dark:text-[#FBBF24]">
          {stats.dailyLimit === 1
            ? t('surveysUsedUpOne')
            : t('surveysUsedUpMany', { limit: stats.dailyLimit })}{' '}
          <a href="/plans" className="font-bold underline">{t('upgradeLink')}</a> {t('forMore')}
        </div>
      )}

      {/* Survey List */}
      {isLoading && page === 1 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SurveyCardSkeleton key={i} />
          ))}
        </div>
      ) : listError && allSurveys.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]">
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{listError.message}</p>
          <button onClick={refetch} className="mt-3 text-sm font-semibold text-[#2563EB]">
            {tc('retry')}
          </button>
        </div>
      ) : allSurveys.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]">
          <ClipboardList size={56} className="mx-auto mb-4 text-[#94A3B8] dark:text-[#64748B]" />
          <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
            {t('noSurveys')}
          </p>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">
            {t('checkBackSurveys')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allSurveys.map((survey) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 sm:p-5 transition-all group',
                survey.completed || limitReached
                  ? 'opacity-70'
                  : 'hover:shadow-md cursor-pointer',
              )}
              onClick={() => handleStartSurvey(survey)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0',
                    `bg-gradient-to-br ${getBrandColor(survey.brand)}`,
                  )}
                >
                  <span className="drop-shadow-md text-white">
                    {(() => {
                      const BrandIcon = getBrandIcon(survey.brand);
                      return <BrandIcon className="w-6 h-6 sm:w-7 sm:h-7" />;
                    })()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                        {survey.title}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        {t('sponsoredBy', { brand: survey.brand })}
                      </p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-[#22C55E] bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                      <Award size={12} />+{formatAmount(survey.rewardAmount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                    <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                      <Clock size={12} />
                      {t('nMin', { n: survey.estimatedTime })}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#334155] px-2 py-0.5 rounded-full">
                      {t('nQuestions', { n: survey.questionsCount })}
                    </span>
                    {survey.currentParticipants > 0 && (
                      <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                        <Users size={12} />
                        {t('nResponses', { n: survey.currentParticipants })}
                      </span>
                    )}
                  </div>
                </div>
                {survey.completed ? (
                  <span className="px-3 py-2 text-xs font-bold rounded-xl flex-shrink-0 flex items-center gap-1 text-[#15803D] bg-[#F0FDF4] dark:bg-[#22C55E]/15 dark:text-[#4ADE80]">
                    <CheckCircle2 size={14} /> {t('done')}
                  </span>
                ) : (
                  <button
                    disabled={limitReached}
                    className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex-shrink-0 touch-min-target disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSurvey(survey);
                    }}
                  >
                    {limitReached ? t('limitReached') : t('start')}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && allSurveys.length > 0 && (
        <div className="py-3 flex justify-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">{t('loadingMore')}</span>
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              className="w-full py-2.5 sm:py-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors text-xs sm:text-sm font-medium text-[#64748B] dark:text-[#94A3B8]"
            >
              {t('loadMoreSurveys')}
            </button>
          )}
        </div>
      )}

      {/* Survey Taking Modal */}
      <AnimatePresence>
        {isTakingSurvey && selectedSurvey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={handleCloseSurvey}
                    className="w-8 h-8 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#334155] flex items-center justify-center transition-colors flex-shrink-0"
                    aria-label={t('closeSurvey')}
                  >
                    <X size={18} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                      {selectedSurvey.title}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {t('brandQuestions', { brand: selectedSurvey.brand, n: questions.length })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-3 py-1 rounded-full flex-shrink-0">
                  +{formatAmount(selectedSurvey.rewardAmount)}
                </span>
              </div>

              {/* Progress */}
              {!isCompleted && questions.length > 0 && (
                <div className="px-4 sm:px-6 py-3 border-b border-[#F1F5F9] dark:border-[#334155] flex-shrink-0">
                  <SurveyProgress
                    current={currentQuestion}
                    total={questions.length}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {surveyError && (
                  <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] dark:bg-[#EF4444]/10 dark:border-[#EF4444]/30 p-3 text-sm text-[#B91C1C] dark:text-[#F87171]">
                    {surveyError}
                  </div>
                )}
                {isLoadingQuestions ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-[#2563EB]" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-6">
                    <button
                      onClick={handleCloseSurvey}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold"
                    >
                      {tc('close')}
                    </button>
                  </div>
                ) : isCompleted ? (
                  <SurveyComplete
                    reward={rewardEarned}
                    onClose={handleCloseSurvey}
                  />
                ) : (
                  <SurveyQuestion
                    question={questions[currentQuestion]}
                    index={currentQuestion}
                    selectedOption={selectedOption}
                    onSelect={handleSelectOption}
                    onNext={handleNextQuestion}
                    onBack={handlePreviousQuestion}
                    isFirst={currentQuestion === 0}
                    isLast={currentQuestion === questions.length - 1}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
