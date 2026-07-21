// src/components/landing/Footer.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

// lucide-react has removed brand/logo icons (Facebook, Instagram, Twitter,
// YouTube) across recent versions — using inline SVGs instead, styled to
// match lucide's stroke-icon look (24x24, currentColor, strokeWidth 2)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C4 15.4 2.4 11.6 3 8c2 1.3 4.2 1.6 6.3.7C6.9 7.4 5.2 4.2 6.2 1.5c2.4 2.9 5.9 4.7 9.7 4.9-.6-2.9 2.3-5.6 5.2-4.3.9.4 1.6 1.1 2 2 1-.2 2-.7 2.9-1.3-.3 1-1 1.9-1.9 2.5.9-.1 1.8-.4 2.6-.8-.4.9-1.1 1.7-1.7 2.5Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22.5 8.5a3 3 0 0 0-2.1-2.1c-1.9-.5-9.4-.5-9.4-.5s-7.5 0-9.4.5A3 3 0 0 0 1.5 8.5 31 31 0 0 0 1 14a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 14a31 31 0 0 0-.5-5.5z" />
      <polygon points="10 17 16 14 10 11" fill="currentColor" stroke="none" />
    </svg>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Platform',
    links: ['Features', 'How It Works', 'Plans', 'FAQs'],
    hrefs: ['#features', '#how', '#plans', '#faq'],
  },
  {
    title: 'Earn',
    links: ['Watch Videos', 'Play Games', 'Offers', 'Surveys'],
    hrefs: ['/earn/videos', '/games', '/earn/offers', '/earn/surveys'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Blog', 'Careers', 'Contact Us'],
    hrefs: ['/about', '/blog', '/careers', '/contact'],
  },
  {
    title: 'Legal',
    links: ['Terms of Service', 'Privacy Policy', 'Cookies Policy'],
    hrefs: ['/terms', '/privacy', '/cookies'],
  },
];

// All social icons are inline SVGs now — lucide-react no longer ships brand logos
const SOCIAL_LINKS = [
  { icon: FacebookIcon, href: '#', label: 'Facebook' },
  { icon: TwitterIcon, href: '#', label: 'Twitter' },
  { icon: InstagramIcon, href: '#', label: 'Instagram' },
  { icon: YoutubeIcon, href: '#', label: 'YouTube' },
];

// Footer variants with proper typing
const footerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const columnVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 + 0.2, duration: 0.4, ease: 'easeOut' },
  }),
};

const iconVariants: Variants = {
  hover: {
    scale: 1.1,
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
};

const linkVariants: Variants = {
  hover: {
    x: 3,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={footerVariants}
      className="bg-navy border-t border-white/10 py-12"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand Column */}
          <motion.div
            variants={columnVariants}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="col-span-2"
          >
            <Link href="/" className="flex items-center gap-3 mb-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -3 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="relative w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-primary to-accent-500"
              >
                <Image
                  src="/img/logo/icon.png"
                  alt="Boostly"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <span className="text-white font-extrabold text-lg">
                Boost<span className="text-gold">ly</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              Boostly is the #1 rewards platform that pays people for doing the
              things they love. Watch videos, play games, complete surveys, and
              earn real cash.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  variants={iconVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Footer Columns */}
          {FOOTER_COLUMNS.map((col, i) => (
            <motion.div
              key={col.title}
              variants={columnVariants}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="text-white text-xs font-bold uppercase tracking-wide mb-3">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link, idx) => (
                  <motion.li
                    key={link}
                    variants={linkVariants}
                    whileHover="hover"
                  >
                    <Link
                      href={col.hrefs[idx] || '#'}
                      className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10"
        >
          <p className="text-white/30 text-xs">
            © {year} <span className="text-white/60">Boostly Pvt Ltd</span>. All
            rights reserved.
          </p>
          <div className="flex items-center gap-6 text-white/30 text-xs">
            <Link href="/privacy" className="hover:text-white/60 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white/60 transition">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-white/60 transition">
              Cookies
            </Link>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-pink-400">❤️</span>
              Made with love
            </span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
