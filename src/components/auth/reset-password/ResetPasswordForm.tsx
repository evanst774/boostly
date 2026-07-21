// components/auth/reset-password/ResetPasswordForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function ResetPasswordForm({
  token,
  onSuccess,
}: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const allValidationsPassed = Object.values(validation).every(
    (v) => v === true,
  );
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid =
    allValidationsPassed && passwordsMatch && formData.password.length > 0;

  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;

    const strengthMap: Record<number, PasswordStrength> = {
      0: { score: 0, label: 'Very Weak', color: 'bg-red-500' },
      1: { score: 1, label: 'Weak', color: 'bg-red-500' },
      2: { score: 2, label: 'Fair', color: 'bg-orange-500' },
      3: { score: 3, label: 'Good', color: 'bg-yellow-500' },
      4: { score: 4, label: 'Strong', color: 'bg-green-500' },
      5: { score: 5, label: 'Very Strong', color: 'bg-emerald-500' },
    };
    return strengthMap[score] || strengthMap[0];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (touched.password || formData.password.length > 0) {
      setValidation({
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecialChar: /[^A-Za-z0-9]/.test(formData.password),
      });
    }
  }, [formData.password, touched.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);
    setTouched({ password: true, confirmPassword: true });

    if (!allValidationsPassed) {
      toast.error('Please meet all password requirements');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
        toast.success('Password reset successfully!');
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setServerErrors(data.errors);
          data.errors.forEach((err: string) => toast.error(err));
        } else {
          setServerErrors([data.message || 'Failed to reset password']);
          toast.error(data.message || 'Failed to reset password');
        }
      }
    } catch {
      setServerErrors(['Something went wrong. Please try again.']);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({
    passed,
    text,
  }: {
    passed: boolean;
    text: string;
  }) => (
    <div className="flex items-center gap-2 text-xs">
      {passed ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      )}
      <span className={passed ? 'text-green-400' : 'text-gray-500'}>
        {text}
      </span>
    </div>
  );

  return (
    <>
      {/* Server Errors */}
      {serverErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
          role="alert"
        >
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Validation Errors</span>
          </div>
          <ul className="space-y-1">
            {serverErrors.map((err, idx) => (
              <li key={idx} className="text-red-400/80 text-xs">
                • {err}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label
            htmlFor="reset-password-new"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            New Password
          </label>
          <div className="relative">
            {/* Icon — hidden on mobile, visible sm+ */}
            <div className="absolute inset-y-0 left-0 hidden sm:flex items-center pl-4 pointer-events-none">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <input
              id="reset-password-new"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              onBlur={() => setTouched({ ...touched, password: true })}
              required
              autoComplete="new-password"
              className="w-full pl-4 sm:pl-11 pr-12 py-3 rounded-xl bg-surface/50 border border-border-subtle text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all touch-manipulation"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Password Strength + Validation */}
          {formData.password.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-xs ml-3 font-medium ${
                    passwordStrength.score >= 4
                      ? 'text-green-400'
                      : passwordStrength.score >= 3
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                <ValidationItem
                  passed={validation.minLength}
                  text="At least 8 characters"
                />
                <ValidationItem
                  passed={validation.hasUppercase}
                  text="Uppercase (A-Z)"
                />
                <ValidationItem
                  passed={validation.hasLowercase}
                  text="Lowercase (a-z)"
                />
                <ValidationItem
                  passed={validation.hasNumber}
                  text="Number (0-9)"
                />
                <ValidationItem
                  passed={validation.hasSpecialChar}
                  text="Special char (!@#$)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reset-password-confirm"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            {/* Icon — hidden on mobile, visible sm+ */}
            <div className="absolute inset-y-0 left-0 hidden sm:flex items-center pl-4 pointer-events-none">
              <CheckCircle className="w-4 h-4 text-gray-500" />
            </div>
            <input
              id="reset-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              required
              autoComplete="new-password"
              className="w-full pl-4 sm:pl-11 pr-12 py-3 rounded-xl bg-surface/50 border border-border-subtle text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all touch-manipulation"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Match Indicator */}
          {touched.confirmPassword && formData.confirmPassword.length > 0 && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" /> Passwords do not match
                </>
              )}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Choose a strong password you don&apos;t use elsewhere. Must be at
            least 8 characters with uppercase, lowercase, numbers, and special
            characters.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resetting...</span>
            </>
          ) : (
            <>
              <span>Reset Password</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </>
  );
}
