// src/contexts/AuthContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SystemRoles } from '@/modules/rbac/roles';
import { isAdminRole } from '@/lib/jwt';

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  emailVerified: boolean;
  isActive: boolean;
  avatar?: string | null;
  avatarKey?: string | null;
  phone?: string | null;
  plan?: string | null;
  badge?: string | null;
  streak?: number;
  totalEarned?: number;
}

interface LoginResponse {
  user?: User;
  requires2FA?: boolean;
  sessionId?: string;
  method?: 'EMAIL' | 'TOTP';
  enabledMethods?: string[];
  needsVerification?: boolean;
  redirectTo?: string;
  message?: string;
  success?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAccountLocked: boolean;
  login: (
    email: string,
    password: string,
    otpCode?: string,
    method?: 'EMAIL' | 'TOTP',
    sessionId?: string,
    isBackupCode?: boolean,
  ) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  refreshUser: () => Promise<void>;
  verify2FA: (
    otpCode: string,
    method: 'EMAIL' | 'TOTP',
    sessionId: string,
  ) => Promise<boolean>;
  resend2FA: (sessionId: string) => Promise<void>;
}

// ============================================
// CONSTANTS
// ============================================

// FIX: '/register' was missing here. It's already an AUTH_ROUTE in
// middleware.ts, but this list wasn't updated to match. That meant
// checkAuth() classified /register as a PROTECTED route (not public,
// not an auth page) — so a normal, expected 401 from /api/auth/me on
// a fresh visitor with no cookie was treated as "you got logged out,"
// triggering clearDeadSessionCookie() + redirect to /login. This must
// stay in sync with middleware.ts's AUTH_ROUTES list.
const AUTH_PAGES = [
  '/login',
  '/register',
  '/2fa',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/verify-email',
  '/account-locked',
];

// Mirrors middleware.ts PUBLIC_ROUTES so checkAuth() doesn't force a
// redirect-to-login on pages that are meant to be public.
const PUBLIC_ROUTES = [
  '/',
  '/forbidden',
  '/unauthorized',
  '/account-locked',
  '/about',
  '/blog',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/resources',
  '/help',
  '/support',
  '/trial',
  '/splash',
  '/onboarding',
  // Mirrors the same addition in middleware.ts — referral links are
  // hit by signed-out visitors, so this has to stay public.
  '/ref',
];

// Admin roles go to /admin/dashboard
const DASHBOARD_ROUTES = {
  [SystemRoles.SUPER_ADMIN]: '/admin/dashboard',
  [SystemRoles.ADMIN]: '/admin/dashboard',
  [SystemRoles.USER]: '/dashboard',
};

function getRoleRedirectPath(role: string): string {
  if (role === SystemRoles.SUPER_ADMIN || role === SystemRoles.ADMIN) {
    return '/admin/dashboard';
  }
  return (
    DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES] || '/dashboard'
  );
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_ROUTES.some(
    (route) => route !== '/' && pathname.startsWith(route + '/'),
  );
}

function isAuthPagePath(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// ============================================
// Clears the auth cookie via /api/auth/logout before redirecting on
// a dead DB session. middleware.ts can only verify JWT validity, not
// DB session liveness (edge runtime can't reach the DB), so its
// "bounce logged-in users off /login" check would otherwise see a
// still-valid JWT and immediately redirect back to /dashboard,
// creating a loop. Clearing the cookie first means middleware sees
// no token on the next request.
// ============================================
async function clearDeadSessionCookie(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('[AuthContext] Failed to clear dead session cookie:', error);
  }
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // ============================================
  // CHECK AUTH
  // ============================================

  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });

      if (res.ok) {
        const data = await res.json();

        if (
          data.user &&
          !data.user.role &&
          data.user.roles &&
          data.user.roles.length > 0
        ) {
          data.user.role = data.user.roles[0];
        }

        if (!data.user.isActive) {
          setIsAccountLocked(true);
          setUser(null);
          if (pathname !== '/account-locked') {
            router.push('/account-locked');
          }
          return null;
        }

        setIsAccountLocked(false);
        setUser(data.user);
        return data.user;
      } else if (res.status === 403) {
        const error = await res.json();
        if (
          error.error?.includes('inactive') ||
          error.error?.includes('locked')
        ) {
          setIsAccountLocked(true);
          setUser(null);
          if (pathname !== '/account-locked') {
            router.push('/account-locked');
          }
        }
        return null;
      } else {
        // 401: no token, invalid token, or a revoked/expired DB
        // session. Must clear the cookie BEFORE redirecting, or
        // middleware will bounce /login straight back here.
        setUser(null);
        setIsAccountLocked(false);

        const onProtectedRoute =
          pathname && !isPublicPath(pathname) && !isAuthPagePath(pathname);

        if (onProtectedRoute) {
          await clearDeadSessionCookie();
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        }

        return null;
      }
    } catch (error) {
      console.error('[AuthContext] Check auth error:', error);
      setUser(null);
      setIsAccountLocked(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  // ============================================
  // REFRESH USER
  // ============================================

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.user && !data.user.role && data.user.roles?.length > 0) {
          data.user.role = data.user.roles[0];
        }
        if (!data.user.isActive) {
          setIsAccountLocked(true);
          setUser(null);
          if (pathname !== '/account-locked') {
            router.push('/account-locked');
          }
        } else {
          setIsAccountLocked(false);
          setUser(data.user);
        }
      } else if (res.status !== 403) {
        setUser(null);
        setIsAccountLocked(false);

        const onProtectedRoute =
          pathname && !isPublicPath(pathname) && !isAuthPagePath(pathname);

        if (onProtectedRoute) {
          await clearDeadSessionCookie();
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Refresh user error:', error);
    }
  }, [pathname, router]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;
    if (!pathname) return;

    if (isAccountLocked && pathname !== '/account-locked') {
      router.replace('/account-locked');
      return;
    }

    if (pathname === '/2fa') return;

    if (user && isAuthPagePath(pathname)) {
      const dashboardPath = getRoleRedirectPath(user.role);
      window.location.href = dashboardPath;
      return;
    }

    // FIX: this is the client-side half of the "admin lands on the
    // consumer dashboard" fix. middleware.ts now bounces an
    // authenticated ADMIN/SUPER_ADMIN away from any non-/admin route on
    // the server, but that only covers requests middleware actually
    // sees. A client-side transition (router.push, a <Link>, the
    // post-login redirect landing on a stale cached RSC payload) can
    // render before the next server round-trip catches it. This closes
    // that gap by re-checking on every pathname change: an admin who
    // ends up anywhere outside /admin that isn't public/auth gets sent
    // to the admin panel.
    if (
      user &&
      isAdminRole(user.role) &&
      !pathname.startsWith('/admin') &&
      !isPublicPath(pathname) &&
      !isAuthPagePath(pathname)
    ) {
      window.location.href = '/admin/dashboard';
    }
  }, [isLoading, user, pathname, router, isAccountLocked]);

  // ============================================
  // LOGIN
  // ============================================

  const login = useCallback(
    async (
      email: string,
      password: string,
      otpCode?: string,
      method?: 'EMAIL' | 'TOTP',
      sessionId?: string,
      isBackupCode?: boolean,
    ): Promise<LoginResponse> => {
      setIsLoading(true);
      try {
        const body: Record<string, unknown> = { email, password };

        if (otpCode && sessionId) {
          body.otpCode = otpCode;
          body.sessionId = sessionId;
          body.is2FAStep = true;
          body.method = method || 'EMAIL';
          if (isBackupCode) {
            body.isBackupCode = true;
          }
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        });

        const data = await res.json();

        if (res.status === 401 && data.message?.includes('deactivated')) {
          setIsAccountLocked(true);
          router.push('/account-locked');
          return { needsVerification: false };
        }

        if (data.requires2FA) {
          return {
            requires2FA: true,
            sessionId: data.sessionId,
            method: data.method,
            enabledMethods: data.enabledMethods,
          };
        }

        if (data.needsVerification) {
          toast.error('Please verify your email before logging in');
          router.push(
            `/verify-email?email=${encodeURIComponent(email)}&from=login`,
          );
          return { needsVerification: true };
        }

        if (res.ok) {
          if (!data.user?.isActive) {
            setIsAccountLocked(true);
            router.push('/account-locked');
            return {};
          }

          setUser(data.user);
          setIsAccountLocked(false);
          toast.success('Welcome back!');

          const redirectPath =
            data.redirectTo || getRoleRedirectPath(data.user?.role);
          router.push(redirectPath);
          return { user: data.user, redirectTo: redirectPath, success: true };
        }

        toast.error(data.message || 'Invalid credentials');
        return { message: data.message };
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Something went wrong. Please try again.');
        return { message: 'Something went wrong. Please try again.' };
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ============================================
  // 2FA HELPERS
  // ============================================

  const verify2FA = useCallback(
    async (
      otpCode: string,
      method: 'EMAIL' | 'TOTP',
      sessionId: string,
    ): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/2fa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otpCode, method, sessionId }),
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setIsAccountLocked(false);
            toast.success('2FA verified successfully!');
            const redirectPath =
              data.redirectTo || getRoleRedirectPath(data.user?.role);
            router.push(redirectPath);
            return true;
          }
        }

        toast.error('Invalid verification code');
        return false;
      } catch (error) {
        console.error('2FA verification error:', error);
        toast.error('Failed to verify 2FA code');
        return false;
      }
    },
    [router],
  );

  const resend2FA = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const res = await fetch('/api/auth/2fa/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('New 2FA code sent to your email');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend 2FA error:', error);
      toast.error('Failed to resend code');
    }
  }, []);

  // ============================================
  // LOGOUT
  // ============================================

  const logout = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
      setUser(null);
      setIsAccountLocked(false);
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  }, []);

  // ============================================
  // COMPUTED
  // ============================================

  const isSuperAdmin = user?.roles?.includes(SystemRoles.SUPER_ADMIN) || false;
  const isAdmin = isSuperAdmin || user?.role === SystemRoles.ADMIN;

  // ============================================
  // PROVIDER
  // ============================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isAccountLocked,
        login,
        logout,
        checkAuth,
        refreshUser,
        verify2FA,
        resend2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
