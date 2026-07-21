// src/components/auth/SudoModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Mail,
  Smartphone,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUDO_CONFIG } from '@/lib/constants/sudo';
import Link from 'next/link';

interface SudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string, method: 'EMAIL' | 'TOTP') => Promise<boolean>;
  method: 'EMAIL' | 'TOTP';
  loading?: boolean;
  availableMethods?: ('EMAIL' | 'TOTP')[];
  onMethodChange?: (method: 'EMAIL' | 'TOTP') => void;
  onSendCode?: (method: 'EMAIL' | 'TOTP') => Promise<void>;
  isSending?: boolean;
  otpSent?: boolean;
  sendCooldown?: number;
}

export function SudoModal({
  isOpen,
  onClose,
  onVerify,
  method,
  loading = false,
  availableMethods = [],
  onMethodChange,
  onSendCode,
  isSending = false,
  otpSent = false,
  sendCooldown = 0,
}: SudoModalProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'EMAIL' | 'TOTP'>(
    method,
  );
  // FIX 1: Remove unused variable
  // const [hasRequestedCode, setHasRequestedCode] = useState(false);

  const hasNoMethods = availableMethods.length === 0;

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(null);
      setIsVerifying(false);
      // setHasRequestedCode(false); // Remove this too
      if (!hasNoMethods) {
        setSelectedMethod(method);
      }
    }
  }, [isOpen, method, hasNoMethods]);

  const handleMethodChange = (newMethod: 'EMAIL' | 'TOTP') => {
    setSelectedMethod(newMethod);
    setCode('');
    setError(null);
    onMethodChange?.(newMethod);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setError(null);
    setIsVerifying(true);

    try {
      const success = await onVerify(code, selectedMethod);
      if (success) {
        setCode('');
        onClose();
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendCode = async () => {
    if (!onSendCode || isSending || sendCooldown > 0) return;
    await onSendCode(selectedMethod);
    // setHasRequestedCode(true); // Remove this
  };

  if (!isOpen) return null;

  const isCodeValid = code.length === 6;
  const isSubmitting = loading || isVerifying;
  const hasMultipleMethods = availableMethods.length > 1;
  const canSendCode = !isSending && sendCooldown === 0 && !isSubmitting;

  // ─── No 2FA Methods View ──────────────────────────────────────────────────

  if (hasNoMethods) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gradient-to-br from-[#0a1020] to-[#0f1a2e] border border-red-500/20 rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Access Denied</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-1">
                    Two-Factor Authentication Required
                  </p>
                  <p className="text-xs text-red-400/70">
                    Sudo mode requires at least one 2FA method (Email or TOTP)
                    to be configured for your account. This protects your
                    account when performing sensitive actions.
                  </p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                What you need to do:
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-400">
                      1
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Go to your{' '}
                    <span className="text-white font-medium">
                      Security Settings
                    </span>
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-400">
                      2
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Set up either{' '}
                    <span className="text-white font-medium">Email 2FA</span> or{' '}
                    <span className="text-white font-medium">
                      Authenticator App (TOTP)
                    </span>
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-400">
                      3
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Return here to activate sudo mode
                  </p>
                </li>
              </ul>
            </div>

            {/* Why 2FA */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">
                <span className="text-amber-400">🔒</span> Two-factor
                authentication adds an extra layer of security to your account
                by requiring a verification code in addition to your password
                when performing sensitive actions like changing passwords,
                emails, or deleting accounts.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <Link
                href="/settings/security#2fa"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Set Up 2FA
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Normal Sudo Verification View ────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gradient-to-br from-[#0a1020] to-[#0f1a2e] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Sudo Mode</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* OTP Sent Status */}
          {otpSent && !isVerifying && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-green-400 font-medium">
                  Code Sent Successfully
                </p>
                <p className="text-[10px] text-green-400/70 mt-0.5">
                  Check your{' '}
                  {selectedMethod === 'EMAIL' ? 'email' : 'authenticator app'}{' '}
                  for the 6-digit code. Code expires in{' '}
                  {SUDO_CONFIG.CODE_EXPIRATION_MINUTES} minutes.
                </p>
              </div>
            </div>
          )}

          {/* Add this near the top of the modal */}
          {!otpSent && !isVerifying && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-amber-400 font-medium">
                  Action Required
                </p>
                <p className="text-[10px] text-amber-400/70 mt-0.5">
                  Click &quot;Send Code&quot; below to receive your verification
                  code
                </p>
              </div>
            </div>
          )}

          {/* Send Code Button */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300 font-medium mb-1">
              {otpSent ? 'Code Sent' : 'Get Verification Code'}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {otpSent
                ? `A verification code has been sent to your ${selectedMethod === 'EMAIL' ? 'email' : 'authenticator app'}. Didn't receive it? You can request a new one.`
                : `Click the button below to receive a verification code via ${selectedMethod === 'EMAIL' ? 'email' : 'your authenticator app'}.`}
            </p>
            <button
              onClick={handleSendCode}
              disabled={!canSendCode}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                canSendCode
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                  : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed opacity-50',
              )}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : sendCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Wait {sendCooldown}s
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {otpSent ? 'Resend Code' : 'Send Code'}
                </>
              )}
            </button>

            {/* Show instruction if code hasn't been sent yet */}
            {!otpSent && !isSending && (
              <p className="text-[10px] text-gray-500 mt-3 text-center">
                Click &quot;Send Code&quot; to receive your verification code
              </p>
            )}
          </div>

          {/* Method Selector */}
          {hasMultipleMethods && (
            <div className="flex gap-2">
              {availableMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMethodChange(m)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2',
                    selectedMethod === m
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                      : 'bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10',
                  )}
                >
                  {m === 'EMAIL' ? (
                    <Mail className="w-3.5 h-3.5" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5" />
                  )}
                  {m === 'EMAIL' ? 'Email' : 'Authenticator'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {selectedMethod === 'EMAIL' ? (
                    <Mail className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCode(val.slice(0, 6));
                    setError(null);
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a1020] border border-white/10 text-white text-sm text-center tracking-[.3em] font-mono focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
              <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                Code expires in {SUDO_CONFIG.CODE_EXPIRATION_MINUTES} minutes
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isCodeValid || isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <p className="text-[10px] text-gray-500">
              <span className="text-amber-400">⚠️</span> Sudo mode grants
              elevated permissions for sensitive actions. This session will
              expire after{' '}
              <span className="text-white font-medium">
                {SUDO_CONFIG.SESSION_DURATION_MINUTES} minutes
              </span>{' '}
              of inactivity.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
