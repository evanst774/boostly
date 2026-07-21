// src/app/(auth)/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to Boostly',
    description:
      "Earn real money every day by watching videos, playing games, completing daily tasks, and inviting friends. It's that simple.",
    icon: '💡',
    bg: 'bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-500/10',
    emojis: ['🎬', '🎮', '📅'],
    labels: ['Watch Videos', 'Play Games', 'Daily Bonus'],
    subLabels: ['+40 Rwf each', '+50 Rwf each', '+100 Rwf'],
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Boost Your Daily Rewards',
    description:
      'Come back every day to claim your streak bonus. Upgrade to Gold or Platinum badges to multiply your earnings by up to 2×.',
    icon: '💰',
    bg: 'bg-gradient-to-br from-green-500/10 via-green-600/5 to-green-500/10',
    badges: [
      {
        name: 'Silver Badge',
        reward: '+15%',
        color: 'border-gray-300',
        icon: '🥈',
        bonus: 'Rwf 5,000',
      },
      {
        name: 'Gold Badge',
        reward: '+30%',
        color: 'border-gold',
        icon: '🥇',
        bonus: 'Rwf 10,000',
      },
    ],
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Invite Friends & Earn More',
    description:
      'Share your unique referral code and earn Rwf 200 for every friend who joins. The more you share, the more you earn — together.',
    icon: '🚀',
    bg: 'bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-purple-500/10',
    stats: [
      { value: 'Rwf 200', label: 'Per referral' },
      { value: '∞', label: 'No limit' },
    ],
    color: 'from-purple-500 to-purple-600',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => {
    if (step === STEPS.length - 1) {
      router.push('/register');
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Responsive height calculations
  const getHeroHeight = () => {
    if (windowHeight < 600) return 'min-h-[200px] max-h-[280px]';
    if (windowHeight < 700) return 'min-h-[250px] max-h-[320px]';
    if (windowHeight < 800) return 'min-h-[280px] max-h-[380px]';
    return 'min-h-[320px] max-h-[440px]';
  };

  const getContentHeight = () => {
    if (windowHeight < 600) return 'min-h-[200px]';
    if (windowHeight < 700) return 'min-h-[230px]';
    if (windowHeight < 800) return 'min-h-[260px]';
    return 'min-h-[280px]';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Hero Section - Responsive height */}
      <motion.div
        className={`flex-shrink-0 ${getHeroHeight()} ${STEPS[step].bg} relative overflow-hidden rounded-b-[2rem] flex items-center justify-center`}
      >
        {/* Animated gradient overlay */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${STEPS[step].color.split(' ')[1]}, transparent 70%)`,
          }}
        />

        {/* Floating elements - Responsive positioning */}
        {STEPS[step].emojis?.map((emoji, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-8, 8, -8],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
            className={`absolute ${
              i === 0
                ? 'top-3 sm:top-6 left-3 sm:left-4'
                : i === 1
                  ? 'top-3 sm:top-6 right-3 sm:right-4'
                  : 'bottom-3 sm:bottom-6 left-3 sm:left-4'
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-xl border border-white/30"
            >
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <span className="text-base sm:text-xl">{emoji}</span>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs font-bold text-navy whitespace-nowrap">
                    {STEPS[step].labels?.[i] || ''}
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-text-muted font-medium whitespace-nowrap">
                    {STEPS[step].subLabels?.[i] || ''}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Badges for step 2 - Responsive */}
        {STEPS[step].badges?.map((badge, i) => (
          <motion.div
            key={badge.name}
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: i * 0.2 + 0.3,
              type: 'spring',
              stiffness: 200,
            }}
            className={`absolute ${
              i === 0
                ? 'top-3 sm:top-8 left-3 sm:left-4'
                : 'bottom-3 sm:bottom-8 right-3 sm:right-4'
            } bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-xl border-2 ${badge.color} min-w-[100px] sm:min-w-[130px]`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">{badge.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-navy truncate">
                  {badge.name}
                </p>
                <p className="text-[8px] sm:text-[10px] text-text-muted truncate">
                  {badge.bonus}
                </p>
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'text-gray-500' : 'text-gold'
                }`}
              >
                {badge.reward}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Stats for step 3 - Responsive */}
        {STEPS[step].stats?.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 + 0.4 }}
            className={`absolute ${
              i === 0
                ? 'bottom-3 sm:bottom-8 left-3 sm:left-4'
                : 'bottom-3 sm:bottom-8 right-3 sm:right-4'
            } bg-white rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-3.5 shadow-xl text-center min-w-[80px] sm:min-w-[100px] border border-white/30`}
          >
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              className="text-base sm:text-xl font-black text-navy"
            >
              {stat.value}
            </motion.p>
            <p className="text-[8px] sm:text-[10px] text-text-muted font-medium whitespace-nowrap">
              {stat.label}
            </p>
          </motion.div>
        ))}

        {/* Main icon with pulse - Responsive size */}
        <motion.div
          key={step}
          initial={{ scale: 0.7, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                '0 0 0 0 rgba(212, 175, 55, 0.2)',
                '0 0 0 20px rgba(212, 175, 55, 0)',
                '0 0 0 0 rgba(212, 175, 55, 0.2)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl sm:rounded-2xl bg-white shadow-2xl flex items-center justify-center text-4xl sm:text-5xl md:text-6xl border-2 border-white/30"
          >
            {STEPS[step].icon}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content Section - Responsive height with proper spacing */}
      <div
        className={`flex-1 ${getContentHeight()} px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-8 flex flex-col overflow-y-auto`}
      >
        {/* Dots - Responsive spacing */}
        <div className="flex gap-2 sm:gap-2.5 justify-center mb-4 sm:mb-8">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 6,
                height: i === step ? 8 : 6,
                backgroundColor: i === step ? '#D4AF37' : '#E5E7EB',
              }}
              transition={{ duration: 0.3 }}
              className="rounded-full"
            />
          ))}
        </div>

        {/* Text with animation - Responsive sizing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex-1"
          >
            <h2 className="text-xl sm:text-2xl font-black text-navy mb-2 sm:mb-3">
              {STEPS[step].title}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm">
              {STEPS[step].description}
            </p>

            {/* Step indicator - Responsive */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 sm:mt-4 flex items-center gap-2"
            >
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i <= step ? 'bg-gold' : 'bg-gray-200'
                    }`}
                    style={{
                      width: i === step ? '12px' : '6px',
                      opacity: i <= step ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] sm:text-[10px] text-text-muted font-medium ml-2">
                {step + 1} / {STEPS.length}
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Actions - Responsive padding and sizing */}
        <div className="mt-auto pt-4 sm:pt-6 space-y-2.5 sm:space-y-3.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="w-full bg-gold hover:bg-gold-hover text-navy font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-2.5 transition-all shadow-lg shadow-gold/20 relative overflow-hidden group text-sm sm:text-base"
          >
            <span className="relative z-10">
              {step === STEPS.length - 1 ? "Get Started — It's Free" : 'Next'}
            </span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative z-10"
            >
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.div>
            {step === STEPS.length - 1 && (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute right-3 sm:right-4 opacity-20"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
            )}
          </motion.button>

          {step > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleBack}
              className="w-full text-text-muted text-xs sm:text-sm font-medium hover:text-navy transition-colors py-1.5 sm:py-2"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1 sm:mr-1.5" />
              Back
            </motion.button>
          )}

          {step === 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => router.push('/login')}
              className="w-full text-text-muted text-xs sm:text-sm font-medium hover:text-navy transition-colors py-1.5 sm:py-2"
            >
              I already have an account
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
