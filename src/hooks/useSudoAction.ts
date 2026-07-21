// src/hooks/useSudoAction.ts
import { useState, useCallback, useEffect } from 'react';
import { useSudoMode } from './useSudoMode';
import toast from 'react-hot-toast';
import { SUDO_CONFIG } from '@/lib/constants/sudo';
import { SudoMethod } from '@/types/sudo';

interface UseSudoActionReturn {
  // Sudo state
  sudoActive: boolean;
  remainingMinutes?: number;
  isExpiringSoon?: boolean;
  availableMethods: ('EMAIL' | 'TOTP')[];
  methodsLoading: boolean;

  // Modal state
  showSudoModal: boolean;
  sudoMethod: SudoMethod;
  isSudoPending: boolean;
  isSendingOtp: boolean;
  otpSent: boolean;
  sendCooldown: number;

  // Actions
  initiateSudoAction: (onSuccess?: () => void) => Promise<void>;
  handleSudoVerify: (code: string, method: SudoMethod) => Promise<boolean>;
  handleSendSudoCode: (method: SudoMethod) => Promise<void>;
  handleSudoModalClose: () => void;
  setSudoMethod: (method: SudoMethod) => void;
}

export function useSudoAction(): UseSudoActionReturn {
  const {
    isActive: sudoActive,
    requestSudo,
    verifySudo,
    availableMethods,
    methodsLoading,
    remainingMinutes,
    isExpiringSoon,
  } = useSudoMode();

  const [showSudoModal, setShowSudoModal] = useState(false);
  const [sudoMethod, setSudoMethod] = useState<SudoMethod>('EMAIL');
  const [isSudoPending, setIsSudoPending] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (sendCooldown > 0) {
      const interval = setInterval(() => {
        setSendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sendCooldown]);

  const initiateSudoAction = useCallback(
    async (onSuccess?: () => void) => {
      if (sudoActive) {
        onSuccess?.();
        return;
      }

      if (methodsLoading) {
        toast.loading('Checking security settings...');
        return;
      }

      if (availableMethods.length === 0) {
        toast.error(
          'You must set up Two-Factor Authentication before performing sensitive actions. Go to Settings → Security.',
          { duration: 5000 },
        );
        return;
      }

      const defaultMethod = availableMethods.includes('TOTP')
        ? 'TOTP'
        : availableMethods[0];
      setSudoMethod(defaultMethod);
      setIsSudoPending(true);
      // there is no auto send allowed
      setOtpSent(false);
      setShowSudoModal(true);
      setIsSudoPending(false);
    },
    [sudoActive, methodsLoading, availableMethods],
  );

  const handleSendSudoCode = useCallback(
    async (method: SudoMethod) => {
      if (isSendingOtp || sendCooldown > 0) return;

      setIsSendingOtp(true);
      try {
        const result = await requestSudo(method);
        if (result) {
          setOtpSent(true);
          setSendCooldown(SUDO_CONFIG.RESEND_COOLDOWN_SECONDS);
        } else {
          toast.error('Failed to send verification code');
        }
      } catch {
        toast.error('Failed to send verification code');
      } finally {
        setIsSendingOtp(false);
      }
    },
    [isSendingOtp, sendCooldown, requestSudo],
  );

  const handleSudoVerify = useCallback(
    async (code: string, method: SudoMethod): Promise<boolean> => {
      const success = await verifySudo(code, method);

      if (success) {
        setIsSudoPending(false);
        setShowSudoModal(false);
      } else {
        setIsSudoPending(false);
      }

      return success;
    },
    [verifySudo],
  );

  const handleSudoModalClose = useCallback(() => {
    setShowSudoModal(false);
    setIsSudoPending(false);
    setOtpSent(false);
    setSendCooldown(0);
    setIsSendingOtp(false);
  }, []);

  return {
    sudoActive,
    remainingMinutes,
    isExpiringSoon,
    availableMethods,
    methodsLoading,
    showSudoModal,
    sudoMethod,
    isSudoPending,
    isSendingOtp,
    otpSent,
    sendCooldown,
    initiateSudoAction,
    handleSudoVerify,
    handleSendSudoCode,
    handleSudoModalClose,
    setSudoMethod,
  };
}
