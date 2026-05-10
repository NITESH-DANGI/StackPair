'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import LevelComputingBanner from '@/components/onboarding/LevelComputingBanner';
import { TrophyIcon } from '@/components/ui/Icons';
import Link from 'next/link';

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      
      if (progress >= 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [target, duration]);

  return <span>{count}</span>;
}

export default function WelcomePage() {
  const [showContent, setShowContent] = useState(false);
  const [primarySkill, setPrimarySkill] = useState<string | null>(null);

  useEffect(() => {
    // Staggered reveal
    setTimeout(() => setShowContent(true), 300);
    
    // Simulate M-02 completing after some time (polling in production)
    const timeout = setTimeout(() => {
      setPrimarySkill('TypeScript');
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <StepIndicator currentState="ACTIVE" />

      <div className="max-w-md mx-auto text-center">
        {/* Decorative sparkles */}
        <div className="relative mb-8">
          <div className="absolute -top-4 left-1/4 w-2 h-2 rounded-full bg-[#7A8EC0]/30 sparkle" />
          <div className="absolute -top-2 right-1/3 w-3 h-3 rounded-full bg-[#F59E0B]/30 sparkle" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-4 left-1/6 w-1.5 h-1.5 rounded-full bg-[#059669]/30 sparkle" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2 right-1/5 w-2 h-2 rounded-full bg-[#EC4899]/30 sparkle" style={{ animationDelay: '1.5s' }} />
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

        {/* Bridge Points card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={showContent ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          className="mt-10 p-8 rounded-3xl bg-[#ECEDF2] border border-[#B8BFDA] shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#7A8EC0]/10 flex items-center justify-center mx-auto mb-4">
            <TrophyIcon className="text-[#7A8EC0]" size={28} />
          </div>
          <p className="text-sm font-medium text-[#7A8EC0] mb-2">You earned</p>
          <div className="text-6xl font-bold text-[#7A8EC0] mb-2 animate-count-up">
            {showContent && <CountUp target={50} />}
          </div>
          <p className="text-lg font-semibold text-[#1A1A1A] mb-1">Bridge Points</p>
          <p className="text-sm text-[#6B7280]">
            Bridge Points unlock premium features and priority matching
          </p>
        </motion.div>

        {/* Level Computing Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.8, ease: 'easeOut' }}
          className="mt-6"
        >
          <LevelComputingBanner primarySkill={primarySkill} skillLevel={primarySkill ? 2 : null} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 1.0, ease: 'easeOut' }}
          className="mt-8"
        >
          <Link
            href="/learn"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#7A8EC0] text-white font-semibold text-base hover:bg-[#6A7EB0] transition-all duration-200 shadow-lg shadow-gray-300"
          >
            Start Exploring
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
