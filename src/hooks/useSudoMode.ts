// src/hooks/useSudoMode.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { SUDO_CONFIG } from '@/lib/constants/sudo';

interface SudoSession {
  isActive: boolean;
  expiresAt?: string;
  remainingTime?: number;
  remainingMinutes?: number;
  totalDurationMinutes: number;
  isExpiringSoon?: boolean;
}

export function useSudoMode() {
  const { user } = useAuth();
  const [session, setSession] = useState<SudoSession>({
    isActive: false,
    totalDurationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<
    ('EMAIL' | 'TOTP')[]
  >([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const wasActiveRef = useRef(false);

  const fetchAvailableMethods = useCallback(async () => {
    if (!user) return;
    setMethodsLoading(true);
    try {
      const res = await fetch('/api/auth/sudo/methods', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableMethods(data.methods ?? []);
      }
    } catch {
      console.error('Failed to fetch sudo methods');
    } finally {
      setMethodsLoading(false);
    }
  }, [user]);

  const checkSudoStatus = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/auth/sudo/check', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();

        if (data.isActive && !wasActiveRef.current) {
          console.log('Sudo mode is active');
        }
        wasActiveRef.current = data.isActive;

        setSession({
          isActive: data.isActive,
          expiresAt: data.expiresAt,
          remainingTime: data.remainingTime,
          remainingMinutes: data.remainingMinutes,
          totalDurationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
          isExpiringSoon:
            data.remainingMinutes < SUDO_CONFIG.EXPIRING_SOON_THRESHOLD_MINUTES,
        });
      }
    } catch {
      console.error('Failed to check sudo status');
    }
  }, [user]);

  const requestSudo = useCallback(
    async (method: 'EMAIL' | 'TOTP' = 'EMAIL') => {
      if (!user) {
        toast.error('Please log in first');
        return null;
      }

      if (!availableMethods.includes(method)) {
        toast.error(
          `${method === 'TOTP' ? 'Authenticator app' : 'Email'} is not configured for your account`,
        );
        return null;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/sudo/request', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Failed to request sudo mode');
          return null;
        }

        setSessionId(data.sessionId);
        toast.success(data.message || 'Verification code sent');
        return data;
      } catch {
        toast.error('Failed to request sudo mode');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, availableMethods],
  );

  const resendCode = useCallback(
    async (method: 'EMAIL' | 'TOTP' = 'EMAIL') => {
      if (!user) {
        toast.error('Please log in first');
        return;
      }

      if (!sessionId) {
        toast.error('No active session found. Please request a new one.');
        return;
      }

      if (!availableMethods.includes(method)) {
        toast.error(
          `${method === 'TOTP' ? 'Authenticator app' : 'Email'} is not configured for your account`,
        );
        return;
      }

      try {
        const res = await fetch('/api/auth/sudo/resend', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Failed to resend code');
          return;
        }

        toast.success(data.message || 'New verification code sent');
      } catch {
        toast.error('Failed to resend code. Please try again.');
      }
    },
    [user, sessionId, availableMethods],
  );

  const verifySudo = useCallback(
    async (code: string, method: 'EMAIL' | 'TOTP' = 'EMAIL') => {
      if (!sessionId) {
        toast.error('No active session found');
        return false;
      }

      setVerifying(true);
      try {
        const res = await fetch('/api/auth/sudo/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, method, sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Invalid verification code');
          return false;
        }

        if (data.isVerified) {
          wasActiveRef.current = true;
          setSession({
            isActive: true,
            expiresAt: data.expiresAt,
            totalDurationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
          });
          toast.success('Sudo mode activated');
          return true;
        }

        return false;
      } catch {
        toast.error('Failed to verify sudo mode');
        return false;
      } finally {
        setVerifying(false);
      }
    },
    [sessionId],
  );

  const requireSudo = useCallback(
    async (action: () => Promise<void>, method: 'EMAIL' | 'TOTP' = 'EMAIL') => {
      await checkSudoStatus();

      if (session.isActive) {
        await action();
        return true;
      }

      const result = await requestSudo(method);
      if (!result) return false;

      return {
        requiresVerification: true,
        sessionId: result.sessionId,
        method: result.method,
      };
    },
    [session, checkSudoStatus, requestSudo],
  );

  const deactivateSudo = useCallback(async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    try {
      const res = await fetch('/api/auth/sudo/deactivate', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to deactivate sudo mode');
        return;
      }

      setSession({
        isActive: false,
        totalDurationMinutes: SUDO_CONFIG.SESSION_DURATION_MINUTES,
      });
      wasActiveRef.current = false;
      toast.success('Sudo mode deactivated');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      toast.error('Failed to deactivate sudo mode');
    }
  }, [user]);

  useEffect(() => {
    fetchAvailableMethods();
  }, [fetchAvailableMethods]);

  useEffect(() => {
    checkSudoStatus();
    const interval = setInterval(checkSudoStatus, 60000);
    return () => clearInterval(interval);
  }, [checkSudoStatus]);

  return {
    session,
    loading,
    verifying,
    sessionId,
    availableMethods,
    methodsLoading,
    checkSudoStatus,
    requestSudo,
    verifySudo,
    requireSudo,
    resendCode,
    isActive: session.isActive,
    remainingMinutes: session.remainingMinutes,
    isExpiringSoon: session.isExpiringSoon,
    deactivateSudo,
    isSudoConfigured: true,
  };
}
