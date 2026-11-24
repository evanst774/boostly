// src/app/(dashboard)/referrals/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { REFERRAL_COMMISSION_LABEL } from '@/lib/constants/referrals';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Link2,
  Send,
  BarChart3,
  Coins,
  Gem,
  Handshake,
  Medal,
  Rocket,
  Share2,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';
import { cn, formatCurrency } from '@/lib/utils';
import { useFormatNumber, useT } from '@/lib/i18n';
import { referrals as referralsMsg } from '@/lib/i18n/messages/referrals';
import { common } from '@/lib/i18n/messages/common';

interface ReferralFriend {
  id?: string;
  name?: string;
  date?: string;
  status?: string;
  /** Commission earned from this friend so far (RWF). */
  reward: number;
}

// Custom SVG icons for Facebook and X (Twitter)
const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function ReferralsPage() {
  const router = useRouter();
  const t = useT(referralsMsg);
  const tc = useT(common);
  const formatNumber = useFormatNumber();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'friends' | 'stats'>(
    'overview',
  );
  const [referralCode, setReferralCode] = useState('');

  const { data, isLoading } = useReferrals();

  const stats = data?.stats || {
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
    totalEarned: 0,
  };

  const friends = data?.friends || [];

  // Fetch referral code from API or use user data
  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        const response = await fetch('/api/referrals/code');
        if (response.ok) {
          const data = await response.json();
          setReferralCode(data.referralCode?.code || '');
        }
      } catch {
        /* code stays empty; the copy button is disabled */
      }
    };
    fetchReferralCode();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: select the code so the user can copy it manually.
      const el = document.getElementById('referral-code');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  const handleShare = (platform: string) => {
    const message = t('shareMessage', { code: referralCode, link: `https://boostly.buzz/ref/${referralCode}` });

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      sms: `sms:?body=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent(t('emailSubject'))}&body=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=https://boostly.buzz/ref/${referralCode}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    } else {
      handleCopyCode();
    }
  };

  const getFriendStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#22C55E]';
      case 'pending':
        return 'bg-[#F59E0B]';
      case 'completed':
        return 'bg-[#8B5CF6]';
      default:
        return 'bg-[#6B7280]';
    }
  };

  const getFriendStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('statusActive');
      case 'pending':
        return t('statusPending');
      case 'completed':
        return (
          <span className="inline-flex items-center gap-0.5">
            <Check size={10} /> {t('statusCompleted')}
          </span>
        );
      default:
        return status;
    }
  };

  // Sample milestone data
  const milestones = [
    {
      id: 1,
      title: t('m5'),
      achieved: true,
      reward: 1000,
      progress: 5,
      target: 5,
      icon: Medal,
    },
    {
      id: 2,
      title: t('m10'),
      achieved: true,
      reward: 2500,
      progress: 10,
      target: 10,
      icon: Star,
    },
    {
      id: 3,
      title: t('m25'),
      achieved: false,
      reward: 5000,
      progress: 12,
      target: 25,
      icon: Rocket,
    },
    {
      id: 4,
      title: t('m50'),
      achieved: false,
      reward: 15000,
      progress: 12,
      target: 50,
      icon: Gem,
    },
  ];

  // Share platforms with custom icons
  const sharePlatforms = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle size={20} />,
      color: 'hover:border-[#25D366] hover:text-[#25D366]',
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: <Send size={20} />,
      color: 'hover:border-[#2563EB] hover:text-[#2563EB]',
    },
    {
      id: 'link',
      label: t('copyLink'),
      icon: <Link2 size={20} />,
      color: 'hover:border-[#8B5CF6] hover:text-[#8B5CF6]',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon size={20} />,
      color: 'hover:border-[#1877F2] hover:text-[#1877F2]',
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      icon: <XIcon size={20} />,
      color: 'hover:border-[#000000] hover:text-[#000000]',
    },
    {
      id: 'email',
      label: t('email'),
      icon: <Mail size={20} />,
      color: 'hover:border-[#EA4335] hover:text-[#EA4335]',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-[#6B7280]">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="hidden lg:flex w-10 h-10 rounded-xl border border-[#F3F4F6] items-center justify-center hover:border-[#2563EB] transition-colors" aria-label={tc('back')}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-sm text-[#6B7280]">
            {t('subtitle')}
          </p>
        </div>
        <button
          className="ml-auto bg-[#8B5CF6] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#7C3AED] transition-colors flex items-center gap-2"
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={16} />
          {t('viewStats')}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4C1D95] via-[#7C3AED] to-[#8B5CF6] p-8 text-white text-center">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            <Users size={36} />
          </div>
          <h2 className="text-2xl font-extrabold">{t('heroTitle')}</h2>
          <p className="text-white/80 text-sm mt-2 max-w-sm mx-auto">
            {t('heroBefore')} <strong>{REFERRAL_COMMISSION_LABEL}</strong> {t('heroAfter')}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2.5 mt-4 text-sm font-bold">
            <Check size={16} className="text-white/80" />
            {t('noLimit')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold">{stats.total}</p>
          <p className="text-xs text-[#6B7280]">{t('totalReferrals')}</p>
          <p className="text-[10px] text-[#22C55E] font-semibold mt-1">
            {t('pendingCount', { count: stats.pending })}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-[#8B5CF6]">
            {formatCurrency(stats.totalEarned)}
          </p>
          <p className="text-xs text-[#6B7280]">{t('totalEarned')}</p>
          <p className="text-[10px] text-[#22C55E] font-semibold mt-1">
            {t('commission', { percent: REFERRAL_COMMISSION_LABEL })}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold">{stats.active}</p>
          <p className="text-xs text-[#6B7280]">{t('activeFriends')}</p>
          <p className="text-[10px] text-[#22C55E] font-semibold mt-1">
            {t('paidPlan', { count: stats.completed })}
          </p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#6B7280]">
          {t('yourCode')}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 bg-[#EFF6FF] border-2 border-dashed border-[#2563EB] rounded-xl px-4 py-3">
            {referralCode ? (
              <p
                id="referral-code"
                className="text-xl font-extrabold text-[#2563EB] tracking-widest text-center select-all"
              >
                {referralCode}
              </p>
            ) : (
              <div className="h-7 w-32 bg-[#DBEAFE] animate-pulse rounded mx-auto" />
            )}
          </div>
          <button
            className="flex-shrink-0 bg-[#2563EB] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
            onClick={handleCopyCode}
            disabled={!referralCode}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
        <p className="text-xs text-[#6B7280] text-center mt-3">
          {t('codeHint', { percent: REFERRAL_COMMISSION_LABEL })}
        </p>
      </div>

      {/* Share Buttons */}
      <div>
        <p className="text-sm font-bold mb-3">{t('shareVia')}</p>
        <div className="grid grid-cols-3 gap-3">
          {sharePlatforms.map((platform) => (
            <button
              key={platform.id}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border border-[#F3F4F6] bg-white transition-all hover:shadow-md',
                platform.color,
              )}
              onClick={() => handleShare(platform.id)}
            >
              {platform.icon}
              <span className="text-xs font-medium text-[#6B7280]">
                {platform.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F8FAFC] rounded-2xl p-1 border border-[#F3F4F6]">
        {[
          { id: 'overview', label: t('tabOverview') },
          { id: 'friends', label: t('tabFriends', { count: stats.total }) },
          { id: 'stats', label: t('tabStats') },
        ].map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]',
            )}
            onClick={() =>
              setActiveTab(tab.id as 'overview' | 'friends' | 'stats')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* How It Works */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-5">
            <h3 className="text-sm font-bold mb-4">{t('howItWorks')}</h3>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  icon: Share2,
                  title: t('step1Title'),
                  desc: t('step1Desc'),
                },
                {
                  step: 2,
                  icon: UserPlus,
                  title: t('step2Title'),
                  desc: t('step2Desc'),
                },
                {
                  step: 3,
                  icon: Coins,
                  title: t('step3Title', { percent: REFERRAL_COMMISSION_LABEL }),
                  desc: t('step3Desc', { percent: REFERRAL_COMMISSION_LABEL }),
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <item.icon size={18} className="text-[#8B5CF6]" />
                      <p className="text-sm font-bold">{item.title}</p>
                    </div>
                    <p className="text-sm text-[#6B7280]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'friends' && (
        <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <Users size={56} className="mx-auto mb-4 text-[#D1D5DB]" />
              <p className="text-[#6B7280] font-medium">{t('noFriends')}</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                {t('noFriendsHint')}
              </p>
            </div>
          ) : (
            friends.map((friend: ReferralFriend, index: number) => (
              <div
                key={friend.id || index}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 hover:bg-[#F8FAFC] transition-colors',
                  index !== friends.length - 1 && 'border-b border-[#F3F4F6]',
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {friend.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase() || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827]">
                    {friend.name || t('friend')}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {t('joined', { date: friend.date || t('recently') })}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-bold',
                      friend.reward > 0 ? 'text-[#22C55E]' : 'text-[#9CA3AF]',
                    )}
                  >
                    {friend.reward > 0
                      ? `+${tc('rwf', { amount: formatNumber(Math.round(friend.reward)) })}`
                      : t('earnsOnEvery', { percent: REFERRAL_COMMISSION_LABEL })}
                  </p>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full text-white',
                      getFriendStatusColor(friend.status || 'pending'),
                    )}
                  >
                    {getFriendStatusLabel(friend.status || 'pending')}
                  </span>
                </div>
              </div>
            ))
          )}
          {friends.length > 0 && (
            <button className="w-full py-3 text-sm font-medium text-[#6B7280] hover:bg-[#F8FAFC] transition-colors border-t border-[#F3F4F6]">
              {t('loadMoreFriends')}
            </button>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Milestones */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('milestones')}</h3>
            </div>
            {milestones.map((milestone) => (
              <div key={milestone.id}>
                <div
                  className={cn(
                    'flex items-center gap-4 px-5 py-4',
                    milestone.achieved && 'bg-[#F0FDF4]',
                    !milestone.achieved && 'border-b border-[#F3F4F6]',
                  )}
                >
                  <milestone.icon
                    size={30}
                    className={cn(
                      'flex-shrink-0',
                      milestone.achieved ? 'text-[#22C55E]' : 'text-[#8B5CF6]',
                    )}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{milestone.title}</p>
                    <p className="text-xs text-[#6B7280]">
                      {milestone.achieved
                        ? t('achieved', { count: milestone.target })
                        : t('progress', { progress: milestone.progress, target: milestone.target })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#8B5CF6]">
                      +{tc('rwf', { amount: milestone.reward })}
                    </p>
                    {milestone.achieved ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                        <Check size={10} /> {t('done')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#6B7280]">
                        {milestone.progress}/{milestone.target}
                      </span>
                    )}
                  </div>
                </div>
                {!milestone.achieved && (
                  <div className="px-5 pb-4">
                    <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-full transition-all"
                        style={{
                          width: `${(milestone.progress / milestone.target) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Earnings History: real commissions only */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold">{t('earningsHistory')}</h3>
            </div>
            {(data?.friends || []).filter((f) => f.reward > 0).length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-[#6B7280]">
                {t('noEarnings')}
              </p>
            ) : (
              (data?.friends || [])
                .filter((f) => f.reward > 0)
                .map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 px-5 py-3 border-b border-[#F3F4F6] last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-lg flex-shrink-0">
                      <Handshake size={18} className="text-[#22C55E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">
                        {f.name || t('friend')}
                      </p>
                      <p className="text-xs text-[#6B7280]">{f.date}</p>
                    </div>
                    <p className="text-sm font-bold text-[#22C55E]">
                      +{tc('rwf', { amount: formatNumber(Math.round(f.reward)) })}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
