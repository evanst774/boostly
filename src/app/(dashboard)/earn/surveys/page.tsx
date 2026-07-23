// src/app/(dashboard)/earn/surveys/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
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
} from 'lucide-react';
import { useSurveys, type SurveySummary } from '@/hooks/useSurveys';
import { useSystemCurrency } from '@/hooks/useSystemCurrency';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { SurveyQuestion as SurveyQuestionRow } from '@/lib/db/schema';

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
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: 'all',
    label: 'All Surveys',
    icon: <BarChart3 size={14} />,
    color: 'from-blue-500 to-purple-500',
  },
  {
    value: 'technology',
    label: 'Technology',
    icon: <Zap size={14} />,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    value: 'shopping',
    label: 'Shopping',
    icon: <Star size={14} />,
    color: 'from-amber-500 to-yellow-500',
  },
  {
    value: 'finance',
    label: 'Finance',
    icon: <TrendingUp size={14} />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    icon: <Shield size={14} />,
    color: 'from-red-400 to-pink-500',
  },
  {
    value: 'education',
    label: 'Education',
    icon: <User size={14} />,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    icon: <Sparkles size={14} />,
    color: 'from-pink-500 to-rose-500',
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
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
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
        <span>Progress</span>
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
        const likertOptions = [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree',
        ];
        return (
          <div className="space-y-2">
            {likertOptions.map((option) => (
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
          <span className="font-semibold">Question {index + 1}</span>
          <span>•</span>
          <span>{type.replace('_', ' ').toUpperCase()}</span>
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
          Back
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
              Submitting...
            </>
          ) : isLast ? (
            'Complete Survey'
          ) : (
            <>
              Next
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

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center text-center py-8 space-y-6"
    >
      <div className="w-24 h-24 rounded-full bg-[#F0FDF4] dark:bg-[#22C55E]/20 border-4 border-[#22C55E] flex items-center justify-center text-5xl animate-scale-in">
        🎉
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">
          Survey Complete!
        </h2>
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          Thank you for sharing your valuable opinion.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#22C55E]/20 dark:to-[#16A34A]/10 rounded-2xl px-8 py-4 border border-[#BBF7D0] dark:border-[#22C55E]/30">
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Reward Earned
        </p>
        <p className="text-3xl font-extrabold text-[#22C55E]">
          {formatAmount(reward)}
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-3 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
      >
        Done
      </button>
    </motion.div>
  );
}

export default function SurveysPage() {
  const router = useRouter();
  const { formatAmount } = useSystemCurrency();
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

  // Convert UI category to schema category (simplified for now)
  const schemaCategory =
    selectedCategory === 'all' ? undefined : selectedCategory;

  const { data, isLoading, refetch } = useSurveys({
    category: schemaCategory,
    search: searchQuery,
    page,
    limit: 20,
  });

  // Memoize surveys to prevent unnecessary re-renders
  const surveys = useMemo(() => data?.surveys || [], [data?.surveys]);
  const totalPages = data?.totalPages || 1;
  const stats = data?.stats || { totalEarned: 0, completed: 0, available: 0 };

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

  const handleStartSurvey = (survey: SurveySummary) => {
    setSelectedSurvey(survey);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setIsTakingSurvey(true);
    setIsCompleted(false);
    setRewardEarned(0);
  };

  const handleCloseSurvey = () => {
    setIsTakingSurvey(false);
    setSelectedSurvey(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setIsCompleted(false);
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const handleNextQuestion = () => {
    if (!selectedOption) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestion < (selectedSurvey?.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitSurvey();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1] || null);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!selectedSurvey) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/content/surveys/${selectedSurvey.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answers.map((answer, index) => ({
              questionId: selectedSurvey.questions?.[index]?.id,
              answer,
            })),
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit survey');
      }

      const result = await response.json();
      setRewardEarned(result.rewardEarned);
      setIsCompleted(true);

      // Refetch surveys to update stats
      refetch();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to submit survey. Please try again.',
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

  const getBrandEmoji = (brand: string) => {
    const emojis: Record<string, string> = {
      'MTN Rwanda': '📶',
      'Bank of Kigali': '🏦',
      'Carrefour Rwanda': '🛒',
      RSSB: '💊',
      'Airtel Rwanda': '📱',
      BK: '🏦',
    };
    return emojis[brand] || '📋';
  };

  const questions = selectedSurvey?.questions || [];

  return (
    <div className="space-y-5 pb-20 lg:pb-0 font-outfit max-w-7xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-xl border border-[#F1F5F9] dark:border-[#334155] flex items-center justify-center hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-all touch-min-target"
            onClick={() => router.back()}
          >
            <ArrowLeft
              size={17}
              className="text-[#64748B] dark:text-[#94A3B8]"
            />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
              Surveys
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] truncate">
              Share your opinion and earn rewards
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-3 py-1.5 rounded-full flex-shrink-0">
            <Award size={14} className="text-[#F59E0B] dark:text-[#FBBF24]" />
            <span className="text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24] whitespace-nowrap">
              Up to 500 RWF
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-3 py-1.5 rounded-full flex-shrink-0">
            <CheckCircle2
              size={14}
              className="text-[#22C55E] dark:text-[#4ADE80]"
            />
            <span className="text-xs font-bold text-[#22C55E] dark:text-[#4ADE80] whitespace-nowrap">
              {stats.completed} completed
            </span>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#F59E0B]/20 dark:to-[#FBBF24]/10 border border-[#FDE68A] dark:border-[#F59E0B]/30 p-5 sm:p-6">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-20 select-none">
          📋
        </div>
        <div className="relative z-10">
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
            Your Opinion Pays! 💰
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Complete surveys from top brands and earn up to 500 RWF per survey.
          </p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                Earned from surveys
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-[#F59E0B]">
                {formatAmount(stats.totalEarned)}
              </p>
            </div>
            <div className="border-l border-[#FDE68A] dark:border-[#F59E0B]/30 pl-6">
              <p className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8]">
                Available
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
            placeholder="Search surveys..."
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
            {cat.label}
          </button>
        ))}
      </div>

      {/* Survey List */}
      {isLoading && page === 1 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SurveyCardSkeleton key={i} />
          ))}
        </div>
      ) : allSurveys.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155]">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-[#64748B] dark:text-[#94A3B8] font-medium">
            No surveys available
          </p>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">
            Check back later for new surveys
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allSurveys.map((survey) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#F1F5F9] dark:border-[#334155] shadow-sm p-4 sm:p-5 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => handleStartSurvey(survey)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0',
                    `bg-gradient-to-br ${getBrandColor(survey.brand)}`,
                  )}
                >
                  <span className="drop-shadow-md">
                    {getBrandEmoji(survey.brand)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                        {survey.title}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        Sponsored by {survey.brand}
                      </p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-[#22C55E] bg-[#F0FDF4] dark:bg-[#22C55E]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                      <Award size={12} />+{survey.rewardAmount} RWF
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                    <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                      <Clock size={12} />
                      {survey.estimatedTime} min
                    </span>
                    <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#334155] px-2 py-0.5 rounded-full">
                      {survey.questionsCount} questions
                    </span>
                    {survey.currentParticipants > 0 && (
                      <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-0.5">
                        <Users size={12} />
                        {survey.currentParticipants} responses
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex-shrink-0 touch-min-target"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSurvey(survey);
                  }}
                >
                  Start Survey
                </button>
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
              <span className="text-sm">Loading more...</span>
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              className="w-full py-2.5 sm:py-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#2563EB]/10 transition-colors text-xs sm:text-sm font-medium text-[#64748B] dark:text-[#94A3B8]"
            >
              Load More Surveys
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
                  >
                    <X size={18} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                      {selectedSurvey.title}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {selectedSurvey.brand} • {questions.length} questions
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#F59E0B]/20 px-3 py-1 rounded-full flex-shrink-0">
                  +{selectedSurvey.rewardAmount} RWF
                </span>
              </div>

              {/* Progress */}
              {!isCompleted && (
                <div className="px-4 sm:px-6 py-3 border-b border-[#F1F5F9] dark:border-[#334155] flex-shrink-0">
                  <SurveyProgress
                    current={currentQuestion}
                    total={questions.length}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {isCompleted ? (
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
