'use client';

import { useState, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import OTPInput from '@/components/ui/OTPInput';
import OTPCountdown from '@/components/auth/OTPCountdown';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const maskedEmail = email
    ? email.replace(/^(.{1,2})(.*)(@.*)$/, (_, first, middle, domain) =>
        first + '•'.repeat(Math.max(middle.length, 3)) + domain
      )
    : 'your email';

  const handleOTPComplete = useCallback(async (otp: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In production: POST /auth/email/verify
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Simulate success — navigate to onboarding
      window.location.href = '/onboarding/profile';
    } catch {
      setError('Incorrect code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleExpire = useCallback(() => {
    setIsExpired(true);
  }, []);

  const handleResend = useCallback(async () => {
    setIsResending(true);
    setError(null);
    setIsExpired(false);
    
    try {
      // In production: POST /auth/email/otp
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setIsResending(false);
    }
  }, []);

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <Logo size="md" />
        </div>

        <div className="card-elevated p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
              Check your email
            </h2>
            <p className="text-[#6B7280]">
              We sent a 6-digit code to <span className="font-medium text-[#4B5563]">{maskedEmail}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <OTPInput
              onComplete={handleOTPComplete}
              disabled={isSubmitting || isExpired}
              error={!!error}
            />
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-[#DC2626] mb-4"
            >
              {error}
            </motion.p>
          )}

          {/* Loading state */}
          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-[#7A8EC0]">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Verifying...
            </div>
          )}

          {/* Countdown */}
          <OTPCountdown
            seconds={60}
            onExpire={handleExpire}
            onResend={handleResend}
            isResending={isResending}
          />
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-[#6B7280] hover:text-[#4B5563] transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen auth-gradient flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7A8EC0] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
