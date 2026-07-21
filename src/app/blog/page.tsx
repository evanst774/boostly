// src/app/blog/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  User,
  Search,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Wallet,
  Sparkles,
  Clock,
  ChevronRight,
  Bookmark,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  X,
  Menu,
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

const posts = [
  {
    id: 1,
    title: 'Getting Started with MotoTrack ERP',
    slug: 'getting-started-mototrack-erp',
    excerpt:
      'A step-by-step guide to setting up your account, adding inventory, and recording your first sale.',
    date: 'Jan 15, 2026',
    author: 'MotoTrack Team',
    category: 'Guides',
    readTime: '5 min read',
    featured: true,
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    id: 2,
    title: '5 Tips for Better Inventory Management',
    slug: '5-tips-inventory-management',
    excerpt:
      'Learn how to track stock levels, manage suppliers, and optimize your inventory for maximum profitability.',
    date: 'Jan 10, 2026',
    author: 'MotoTrack Team',
    category: 'Tips',
    readTime: '4 min read',
    featured: false,
    icon: <Zap className="w-5 h-5" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    id: 3,
    title: 'Understanding Financial Reports',
    slug: 'understanding-financial-reports',
    excerpt:
      'Master your business finances with our comprehensive guide to profit & loss, cash flow, and balance reports.',
    date: 'Jan 5, 2026',
    author: 'MotoTrack Team',
    category: 'Finance',
    readTime: '6 min read',
    featured: false,
    icon: <Wallet className="w-5 h-5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 4,
    title: 'How Two-Factor Authentication Protects Your Data',
    slug: '2fa-protects-your-data',
    excerpt:
      'Security matters. Learn why 2FA is essential and how to enable it for your MotoTrack account.',
    date: 'Dec 28, 2025',
    author: 'MotoTrack Team',
    category: 'Security',
    readTime: '3 min read',
    featured: false,
    icon: <Shield className="w-5 h-5" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 5,
    title: 'Managing Customer Relationships with MotoTrack',
    slug: 'managing-customer-relationships',
    excerpt:
      'Build stronger customer relationships with contact management, debt tracking, and contract tools.',
    date: 'Dec 20, 2025',
    author: 'MotoTrack Team',
    category: 'Customers',
    readTime: '4 min read',
    featured: false,
    icon: <Users className="w-5 h-5" />,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
];

const categories = [
  'All',
  'Guides',
  'Tips',
  'Finance',
  'Security',
  'Customers',
];

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Lock scroll on mobile filter
  useEffect(() => {
    if (mobileFilterOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts.find((p) => p.featured);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubscribing(false);
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <section className="relative sm:pt-24 pb-8 sm:pb-12 overflow-hidden safe-top">
        <div className="absolute inset-0 bg-hero-dark" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/10 to-cyan-600/10 blur-3xl rounded-full" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 sm:mb-6 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold bg-accent-500/10 border border-accent-500/20 text-accent-400 mb-4">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Latest Updates
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 font-space-grotesk">
              MotoTrack <span className="text-gradient-blue">Blog</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm">
              Tips, guides, and updates about business management and ERP
              software.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-4 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 sm:mb-10"
            >
              <span className="text-[10px] sm:text-xs font-semibold text-accent-400 uppercase tracking-wider mb-3 block">
                ✨ Featured Article
              </span>
              <Link href={`/blog/${featuredPost.slug}`} className="block">
                <div className="relative rounded-2xl overflow-hidden border border-primary-500/20 bg-gradient-to-br from-primary-500/10 to-accent-500/5 p-5 sm:p-8 group hover:border-primary-500/40 transition-all">
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-[10px] sm:text-xs font-medium">
                      <Bookmark className="w-3 h-3" /> Featured
                    </span>
                  </div>
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 ${featuredPost.color} bg-white/5`}
                  >
                    {featuredPost.icon}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 text-[10px] sm:text-xs text-gray-500">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                      {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featuredPost.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {featuredPost.author}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4 max-w-2xl">
                    {featuredPost.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary-400 font-medium group-hover:gap-2 transition-all">
                    Read Article <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Search + Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 touch-manipulation min-h-[44px]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Category Pills */}
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation min-h-[36px] ${
                    activeCategory === cat
                      ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm touch-manipulation min-h-[44px] justify-center"
            >
              <Menu className="w-4 h-4" /> Categories
            </button>
          </div>

          {/* Mobile Category Overlay */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 sm:hidden">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-[#0A0F1A] rounded-t-2xl border-t border-white/10 p-5 safe-bottom animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Categories</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white touch-manipulation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setMobileFilterOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-manipulation min-h-[44px] flex-1 ${
                        activeCategory === cat
                          ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400'
                          : 'bg-white/5 border border-white/10 text-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          <p className="text-[10px] sm:text-xs text-gray-600 mb-4">
            Showing {filteredPosts.length} of {posts.length} articles
            {activeCategory !== 'All' && (
              <span>
                {' '}
                in <span className="text-gray-400">{activeCategory}</span>
              </span>
            )}
          </p>

          {/* Posts Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-xl border ${post.bg} p-4 sm:p-5 hover:scale-[1.01] transition-all cursor-pointer group`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${post.color} bg-white/5`}
                  >
                    {post.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                      <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                        {post.category}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-gray-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-[10px] sm:text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {post.author}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No articles match your search.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('All');
                }}
                className="text-primary-400 text-xs mt-2 hover:text-primary-300"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 sm:mt-16 bg-gradient-to-br from-primary-500/10 to-accent-500/5 rounded-2xl border border-primary-500/20 p-6 sm:p-8 text-center"
          >
            {subscribed ? (
              <div className="py-4">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Subscribed!
                </h3>
                <p className="text-gray-400 text-sm">
                  You&apos;ll receive our latest articles directly in your
                  inbox.
                </p>
              </div>
            ) : (
              <>
                <Mail className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Stay in the Loop
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-5 max-w-md mx-auto">
                  Get the latest ERP tips, product updates, and business
                  insights delivered to your inbox.
                </p>
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 touch-manipulation min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[44px] flex-shrink-0"
                  >
                    {subscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{' '}
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Subscribe
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
