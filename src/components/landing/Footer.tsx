// src/components/landing/Footer.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';

// Social Icons
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

const SOCIAL_LINKS = [
  {
    icon: FacebookIcon,
    href: 'https://facebook.com/boostly',
    label: 'Facebook',
  },
  {
    icon: InstagramIcon,
    href: 'https://instagram.com/boostly',
    label: 'Instagram',
  },
];

// Footer variants
const footerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
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
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10">
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
                  target="_blank"
                  rel="noopener noreferrer"
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

          {/* Platform */}
          <motion.div
            variants={columnVariants}
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="text-white text-xs font-bold uppercase tracking-wide mb-3">
              Platform
            </p>
            <ul className="space-y-2.5">
              {[
                { name: 'Features', href: '#features' },
                { name: 'How It Works', href: '#how' },
                { name: 'Plans', href: '#plans' },
                { name: 'FAQ', href: '/resources/faq' },
              ].map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            variants={columnVariants}
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="text-white text-xs font-bold uppercase tracking-wide mb-3">
              Resources
            </p>
            <ul className="space-y-2.5">
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Support', href: '/support' },
              ].map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            variants={columnVariants}
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="text-white text-xs font-bold uppercase tracking-wide mb-3">
              Legal
            </p>
            <ul className="space-y-2.5">
              {[
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Cookie Policy', href: '/cookies' },
              ].map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Get Started */}
          <motion.div
            variants={columnVariants}
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="text-white text-xs font-bold uppercase tracking-wide mb-3">
              Get Started
            </p>
            <ul className="space-y-2.5">
              {[
                { name: 'Sign Up', href: '/register' },
                { name: 'Log In', href: '/login' },
              ].map((link) => (
                <motion.li
                  key={link.name}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-white text-xs transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
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
            © {year} <span className="text-white/60">Boostly</span>. All rights
            reserved.
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
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
