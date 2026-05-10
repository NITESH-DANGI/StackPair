'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import OAuthButton from '@/components/auth/OAuthButton';
import Logo from '@/components/ui/Logo';
import { ShieldCheckIcon, UsersIcon, ZapIcon } from '@/components/ui/Icons';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const register = useAuthStore((s) => s.register);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Store display name for use after OTP verification in onboarding
      if (displayName) sessionStorage.setItem('stackpair_display_name', displayName);

      await register(email);
      window.location.href = `/verify?email=${encodeURIComponent(email)}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (message === 'OTP_RATE_LIMITED') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-gradient flex">
      {/* Left side — Branding */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24"
      >
        <div className="mb-16">
          <Logo size="lg" />
        </div>

        <h1 className="font-display text-5xl xl:text-6xl font-semibold text-[#1A1A1A] leading-tight mb-6">
          Join thousands of<br />
          developers learning<br />
          <span className="text-[#7A8EC0]">together</span>
        </h1>

        <div className="flex items-center gap-6 mt-8">
          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
            <span className="w-6 h-6 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <ShieldCheckIcon className="text-[#059669]" size={14} />
            </span>
            AI-Verified Profiles
          </div>
          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
            <span className="w-6 h-6 rounded-full bg-[#DBEAFE] flex items-center justify-center">
              <UsersIcon className="text-[#3B82F6]" size={14} />
            </span>
            No Fake Accounts
          </div>
          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
            <span className="w-6 h-6 rounded-full bg-[#ECEDF2] flex items-center justify-center">
              <ZapIcon className="text-[#7A8EC0]" size={14} />
            </span>
            Free to Start
          </div>
        </div>
      </motion.div>

      {/* Right side — Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="card-elevated p-8 sm:p-10">
            <div className="mb-8 lg:hidden">
              <Logo size="sm" />
            </div>

            <h2 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
              Create your account
            </h2>
            <p className="text-[#6B7280] mb-8">
              Start learning with peers today
            </p>

            <div className="space-y-3 mb-6">
              <OAuthButton provider="github" />
              <OAuthButton provider="google" />
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#E5E5E3]" />
              <span className="text-sm text-[#9CA3AF]">or sign up with email</span>
              <div className="flex-1 h-px bg-[#E5E5E3]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-[#4B5563] mb-1.5">
                  Display Name <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3.5 rounded-xl border border-[#E5E5E3] bg-white text-[15px] transition-all duration-200 outline-none hover:border-[#D4D4D0] focus:border-[#7A8EC0]"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-[#4B5563] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    onBlur={() => email && !validateEmail(email) && setError('Enter a valid email address')}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border text-[15px] transition-all duration-200 outline-none
                      ${error
                        ? 'border-[#DC2626] bg-[#FEF2F2]'
                        : 'border-[#E5E5E3] bg-white hover:border-[#D4D4D0] focus:border-[#7A8EC0]'
                      }`}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'signup-email-error' : undefined}
                  />
                </div>
                {error && (
                  <p id="signup-email-error" className="mt-1.5 text-sm text-[#DC2626]">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#7A8EC0] text-white font-semibold text-[15px] hover:bg-[#6A7EB0] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <>
                    Send Code
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-[#9CA3AF] text-center mt-4">
              We&apos;ll send you a 6-digit verification code
            </p>
          </div>

          <p className="text-center mt-6 text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#7A8EC0] font-medium hover:text-[#6A7EB0] transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
