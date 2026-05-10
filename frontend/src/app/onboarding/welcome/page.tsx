'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import LevelComputingBanner from '@/components/onboarding/LevelComputingBanner';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { OnboardingStateResponse, VerificationStatus } from '@/lib/types/auth';

export default function WelcomePage() {
  const [showContent, setShowContent] = useState(false);
  const [completeCalled, setCompleteCalled] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  // Call /onboarding/complete on mount to transition to ACTIVE
  useEffect(() => {
    if (completeCalled) return;
    setCompleteCalled(true);

    (async () => {
      try {
        await api<OnboardingStateResponse>('/onboarding/complete', {
          method: 'POST',
        });
      } catch (err) {
        // If already ACTIVE, that's fine
        if (err instanceof ApiError && err.detail === 'INVALID_ONBOARDING_STATE') {
          // Already completed — not an error
        } else {
          setCompleteError(err instanceof Error ? err.message : 'Failed to complete onboarding');
        }
      }
    })();
  }, [completeCalled]);

  // Staggered reveal
  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  // Poll verification status
  useEffect(() => {
    let cancelled = false;

    const pollStatus = async () => {
      try {
        const status = await api<VerificationStatus>('/users/me/verification-status', {
          method: 'GET',
        });
        if (!cancelled) {
          setVerificationStatus(status);
        }
      } catch {
        // No verification run yet — that's normal
      }
    };

    // Initial fetch
    pollStatus();

    // Poll every 10 seconds for up to 2 minutes
    const interval = setInterval(pollStatus, 10000);
    const timeout = setTimeout(() => clearInterval(interval), 120000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const primarySkill = verificationStatus?.normalised_primary_skill || null;
  const skillLevel = verificationStatus?.assigned_level || null;

  return (
    <>
      <StepIndicator currentState="ACTIVE" />

      <div className="max-w-md mx-auto text-center">
        {/* Decorative sparkles */}
        <div className="relative mb-8">
          <div className="absolute -top-4 left-1/4 w-2 h-2 rounded-full bg-[#7A8EC0]/30 sparkle" />
          <div className="absolute -top-2 right-1/3 w-3 h-3 rounded-full bg-[#F59E0B]/30 sparkle" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-4 left-[16%] w-1.5 h-1.5 rounded-full bg-[#059669]/30 sparkle" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2 right-[20%] w-2 h-2 rounded-full bg-[#EC4899]/30 sparkle" style={{ animationDelay: '1.5s' }} />
          <div className="absolute -top-6 left-1/2 w-2.5 h-2.5 rounded-full bg-[#8B5CF6]/30 sparkle" style={{ animationDelay: '0.7s' }} />
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A1A1A] mb-3 leading-tight">
            Welcome to<br />
            <span className="text-[#7A8EC0]">StackPair!</span>
          </h1>
          <p className="text-lg text-[#6B7280]">
            You&apos;re all set to start your learning journey
          </p>
        </motion.div>

        {/* Onboarding complete message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={showContent ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          className="mt-10 p-8 rounded-3xl bg-[#ECEDF2] border border-[#B8BFDA] shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-lg font-semibold text-[#1A1A1A] mb-1">Profile Complete</p>
          <p className="text-sm text-[#6B7280]">
            Your account is now active. Connect your platforms to get your AI-verified skill level.
          </p>
        </motion.div>

        {/* Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.8, ease: 'easeOut' }}
          className="mt-6"
        >
          <LevelComputingBanner primarySkill={primarySkill} skillLevel={skillLevel} />
        </motion.div>

        {completeError && (
          <p className="mt-4 text-sm text-[#DC2626]">{completeError}</p>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 1.0, ease: 'easeOut' }}
          className="mt-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#7A8EC0] text-white font-semibold text-base hover:bg-[#6A7EB0] transition-all duration-200 shadow-lg shadow-gray-300"
          >
            Go to Dashboard
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
