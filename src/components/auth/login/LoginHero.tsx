// components/auth/login/LoginHero.tsx
'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Shield,
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  delay: number;
}

function FeatureCard({
  icon: Icon,
  title,
  subtitle,
  color,
  delay,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group cursor-pointer touch-manipulation hover:bg-white/5 transition-all duration-300 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-3.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color})` }}
      >
        <Icon size={18} className="sm:w-[22px] sm:h-[22px]" color="#ffffff" />
      </div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-semibold text-white">
          {title}
        </div>
        <div className="text-[10px] sm:text-xs text-gray-500">{subtitle}</div>
      </div>
    </motion.div>
  );
}

export function LoginHero() {
  const floatingElements = [
    { icon: Sparkles, x: '10%', y: '20%', delay: 0 },
    { icon: Shield, x: '85%', y: '15%', delay: 1 },
    { icon: TrendingUp, x: '90%', y: '70%', delay: 2 },
  ];

  return (
    <div className="relative hidden lg:flex flex-1 flex-col justify-between p-8 xl:p-12 overflow-hidden bg-gradient-to-br from-[#0A1530] via-[#071122] to-[#050B1A]">
      {/* Animated floating elements */}
      {floatingElements.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ delay: item.delay, duration: 0.8 }}
          className="absolute hidden xl:block"
          style={{ left: item.x, top: item.y }}
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: item.delay }}
          >
            <item.icon className="w-8 h-8 text-blue-400/20" />
          </motion.div>
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-10 xl:mb-12"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-rebond-bold text-xl text-white">
              Moto<span className="text-blue-400">Track</span>
            </div>
            <div className="text-xs text-gray-500">ERP Management System</div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl xl:text-5xl font-rebond-bold text-white leading-tight mb-4">
            Business Management,
            <br />
            <span className="text-blue-400">Simplified.</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md leading-relaxed">
            Streamline your operations, track sales, manage customers, and grow
            your business with confidence.
          </p>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3 mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-300">
              Complete business management platform
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-300">
              Real-time analytics and reporting
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-300">
              Customer management and debt tracking
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-300">
              Streamlined inventory and sales workflows
            </span>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <FeatureCard
            icon={LayoutDashboard}
            title="Dashboard"
            subtitle="Analytics Overview"
            color="#3b82f6, #2563eb"
            delay={0.4}
          />
          <FeatureCard
            icon={FileText}
            title="Sales & Contracts"
            subtitle="Manage Transactions"
            color="#22c55e, #16a34a"
            delay={0.5}
          />
          <FeatureCard
            icon={Shield}
            title="Debt Tracking"
            subtitle="Monitor Payments"
            color="#8b5cf6, #7c3aed"
            delay={0.6}
          />
          <FeatureCard
            icon={BarChart3}
            title="Reports"
            subtitle="Business Analytics"
            color="#f59e0b, #d97706"
            delay={0.7}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto pt-8">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400/50" /> Secure
          </span>
          <span className="w-px h-3 bg-gray-700" />
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />{' '}
            Reliable
          </span>
          <span className="w-px h-3 bg-gray-700" />
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />{' '}
            Powerful
          </span>
        </div>
      </div>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
    </div>
  );
}
