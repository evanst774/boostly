// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      // ============================================
      // FONTS
      // ============================================
      fontFamily: {
        // Dashboard - Outfit (Local Font) - PRIMARY DASHBOARD FONT
        outfit: ['var(--font-outfit)', 'sans-serif'],
        'outfit-medium': ['var(--font-outfit-medium)', 'sans-serif'],

        // Alternative dashboard fonts
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        manrope: ['var(--font-manrope)', 'sans-serif'],
        'plus-jakarta': ['var(--font-plus-jakarta-sans)', 'sans-serif'],

        // Landing Page - ES Rebond Grotesque (Local Fonts)
        'rebond-thin': ['var(--font-rebond-thin)', 'sans-serif'],
        'rebond-light': ['var(--font-rebond-light)', 'sans-serif'],
        'rebond-regular': ['var(--font-rebond-regular)', 'sans-serif'],
        'rebond-medium': ['var(--font-rebond-medium)', 'sans-serif'],
        'rebond-semibold': ['var(--font-rebond-semibold)', 'sans-serif'],
        'rebond-bold': ['var(--font-rebond-bold)', 'sans-serif'],
        'rebond-extrabold': ['var(--font-rebond-extrabold)', 'sans-serif'],

        // Shortcut for regular Rebond
        rebond: ['var(--font-rebond-regular)', 'sans-serif'],

        // Monospace
        cascadia: ['var(--font-cascadia-regular)', 'monospace'],
        'cascadia-bold': ['var(--font-cascadia-bold)', 'monospace'],

        // Default - fallback chain
        sans: [
          'var(--font-outfit)',
          'var(--font-manrope)',
          'var(--font-plus-jakarta-sans)',
          'var(--font-space-grotesk)',
          'var(--font-rebond-regular)',
          'system-ui',
          'sans-serif',
        ],
      },
      // ============================================
      // COLORS - BOOSTLY BRAND
      // ============================================
      colors: {
        // Primary Brand
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        'primary-hover': '#1D4ED8',
        'primary-light': '#EFF6FF',

        // Navy (Dark sections)
        navy: {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          lighter: '#334155',
        },

        // Gold (CTAs, points, streak)
        gold: {
          DEFAULT: '#FBBF24',
          hover: '#F59E0B',
          light: '#FFFBEB',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },

        // Status
        success: {
          DEFAULT: '#22C55E',
          light: '#F0FDF4',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEF2F2',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        purple: {
          DEFAULT: '#8B5CF6',
          light: '#F5F3FF',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        pink: {
          DEFAULT: '#EC4899',
          light: '#FDF2F8',
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
        },

        // Neutrals - Slate based (more modern)
        bg: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        'border-light': '#F1F5F9',

        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        full: '9999px',
      },

      // ============================================
      // BOX SHADOWS
      // ============================================
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        md: '0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04)',
        lg: '0 8px 32px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06)',
        xl: '0 20px 60px rgba(0,0,0,.12)',
        blue: '0 8px 32px rgba(37,99,235,.25)',
        gold: '0 8px 24px rgba(251,191,36,.35)',
        glow: '0 0 40px rgba(37,99,235,.15)',
        sidebar: '4px 0 24px rgba(0,0,0,.06)',
      },

      // ============================================
      // BACKGROUND IMAGES
      // ============================================
      backgroundImage: {
        'navy-gradient':
          'linear-gradient(160deg, #0F172A 0%, #1E293B 55%, #334155 100%)',
        'blue-gradient':
          'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #60A5FA 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'hero-gradient':
          'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.15), transparent 70%)',
      },

      // ============================================
      // ANIMATIONS
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.45s cubic-bezier(.32,.72,0,1) forwards',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        float: 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-blue': 'pulseBlue 2s ease-in-out infinite',
        'toast-in': 'toastIn 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(32px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-32px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37,99,235,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(37,99,235,0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseBlue: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        toastIn: {
          from: { transform: 'translateX(110%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.9)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },

      // ============================================
      // SPACING
      // ============================================
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },

      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },

      // ============================================
      // TRANSITIONS
      // ============================================
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        glow: 'box-shadow, border-color',
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ============================================
      // Z-INDEX
      // ============================================
      zIndex: {
        '1': '1',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        '100': '100',
        '200': '200',
        '1000': '1000',
        '9999': '9999',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    function ({
      addUtilities,
    }: {
      addUtilities: (utilities: Record<string, any>) => void;
    }) {
      addUtilities({
        // Hide scrollbars but keep scrolling
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Thin custom scrollbars
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '5px',
            height: '5px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(203, 213, 225, 0.5)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(148, 163, 184, 0.7)',
            },
          },
        },
        // Touch target min sizes (WCAG 2.5.5)
        '.touch-min-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        // Touch manipulation for better touch handling
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        // Safe area insets for PWA
        '.safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        // Glassmorphism
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-light': {
          background: 'rgba(255, 255, 255, 0.03)',
          'backdrop-filter': 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
        '.glass-card': {
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          'backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
        },
        // Glow effects
        '.glow-blue': {
          'box-shadow':
            '0 0 20px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.2)',
        },
        '.glow-gold': {
          'box-shadow':
            '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2)',
        },
        // Text gradients
        '.text-gradient-blue': {
          background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          color: 'transparent',
        },
        '.text-gradient-gold': {
          background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          color: 'transparent',
        },
        // Text balance
        '.text-balance': {
          'text-wrap': 'balance',
        },
        // Hover scale
        '.hover-scale': {
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
        // Active state glow
        '.active-glow': {
          '&.active': {
            'box-shadow': '0 0 20px rgba(37, 99, 235, 0.3)',
          },
        },
      });
    },
  ],
};

export default config;
