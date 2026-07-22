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

interface OAuthState {
  provider: 'google' | 'facebook' | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAccountLocked: boolean;
  oauthState: OAuthState;
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
  initiateOAuth: (provider: 'google' | 'facebook', returnTo?: string) => void;
  handleOAuthCallback: (params: URLSearchParams) => Promise<void>;
  clearOAuthState: () => void;
}

// ============================================
// CONSTANTS
// ============================================

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
  '/ref',
];

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
// HELPERS
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
  const [oauthState, setOauthState] = useState<OAuthState>({
    provider: null,
    isLoading: false,
    error: null,
  });
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
  // OAUTH HELPERS
  // ============================================

  const initiateOAuth = useCallback(
    (provider: 'google' | 'facebook', returnTo: string = '/dashboard') => {
      setOauthState({ provider, isLoading: true, error: null });

      const params = new URLSearchParams();
      params.set('returnTo', returnTo);

      // Store return URL in session storage for recovery
      try {
        sessionStorage.setItem('oauth_return_to', returnTo);
      } catch {
        // Ignore storage errors
      }

      const url = `/api/auth/oauth/${provider}?${params.toString()}`;
      window.location.href = url;
    },
    [],
  );

  const handleOAuthCallback = useCallback(
    async (params: URLSearchParams): Promise<void> => {
      const token = params.get('token');
      const error = params.get('error');
      const message = params.get('message');

      setOauthState((prev) => ({ ...prev, isLoading: true }));

      if (error) {
        setOauthState({
          provider: null,
          isLoading: false,
          error: message || 'Authentication failed. Please try again.',
        });
        toast.error(message || 'Authentication failed');
        router.push('/login');
        return;
      }

      if (token) {
        try {
          // Verify the token and fetch user
          const res = await fetch('/api/auth/me', {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              setIsAccountLocked(false);
              toast.success(
                `Welcome${data.user.name ? ` ${data.user.name}` : ''}!`,
              );

              const returnTo =
                sessionStorage.getItem('oauth_return_to') || '/dashboard';
              sessionStorage.removeItem('oauth_return_to');

              const redirectPath = getRoleRedirectPath(data.user.role);
              router.push(returnTo || redirectPath);
              return;
            }
          }
        } catch (err) {
          console.error('[OAuth] Failed to verify token:', err);
        }
      }

      // If we get here, something went wrong
      setOauthState({
        provider: null,
        isLoading: false,
        error: 'Authentication failed. Please try again.',
      });
      toast.error('Authentication failed');
      router.push('/login');
    },
    [router],
  );

  const clearOAuthState = useCallback(() => {
    setOauthState({
      provider: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  // Handle OAuth callback on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token || error) {
      handleOAuthCallback(params);
    }
  }, [handleOAuthCallback]);

  // Check auth on mount and pathname change
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Handle redirects based on auth state
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

    // Admin routing
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
      clearOAuthState();
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  }, [clearOAuthState]);

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
        oauthState,
        login,
        logout,
        checkAuth,
        refreshUser,
        verify2FA,
        resend2FA,
        initiateOAuth,
        handleOAuthCallback,
        clearOAuthState,
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
