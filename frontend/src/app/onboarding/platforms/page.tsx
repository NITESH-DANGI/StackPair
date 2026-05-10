'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import PlatformConnectCard from '@/components/onboarding/PlatformConnectCard';
import LevelComputingBanner from '@/components/onboarding/LevelComputingBanner';
import { TargetIcon, LayoutIcon, BriefcaseIcon, GlobeIcon, MicIcon, RocketIcon, HandshakeIcon } from '@/components/ui/Icons';
import { PLATFORMS, GOALS, type Platform } from '@/lib/types/auth';
import React from 'react';

const GOAL_ICONS: Record<string, React.ReactNode> = {
  dsa_prep: <TargetIcon size={22} />,
  system_design: <LayoutIcon size={22} />,
  portfolio_build: <BriefcaseIcon size={22} />,
  open_source: <GlobeIcon size={22} />,
  interview_ready: <MicIcon size={22} />,
  learn_new_stack: <RocketIcon size={22} />,
  mentor_others: <HandshakeIcon size={22} />,
};

export default function PlatformsPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, string>>({});
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGitHubConnected = !!connectedPlatforms['github'];

  const handleConnect = useCallback(async (platformId: Platform) => {
    // In production: POST /onboarding/connect-platform with OAuth
    // Simulating connection
    await new Promise(resolve => setTimeout(resolve, 800));
    setConnectedPlatforms(prev => ({
      ...prev,
      [platformId]: platformId === 'github' ? 'nitesh_k' : 'user_' + platformId,
    }));
  }, []);

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : prev.length < 5
        ? [...prev, goalId]
        : prev
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isGitHubConnected) {
      setError('GitHub connection is required');
      return;
    }
    if (selectedGoals.length === 0) {
      setError('Please select at least 1 goal');
      return;
    }

    setIsLoading(true);
    try {
      // In production: PATCH /onboarding/goals
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = '/onboarding/welcome';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StepIndicator currentState="SKILLS_SET" />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-lg mx-auto"
      >
        {/* Section 1: Platforms */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
              Connect your platforms
            </h1>
            <p className="text-[#6B7280]">Link your developer accounts to verify your skills</p>
          </div>

          <div className="space-y-3">
            {PLATFORMS.map((platform) => (
              <PlatformConnectCard
                key={platform.id}
                platform={platform}
                isConnected={!!connectedPlatforms[platform.id]}
                platformUsername={connectedPlatforms[platform.id]}
                onConnect={() => handleConnect(platform.id)}
              />
            ))}
          </div>

          {/* Level computing banner */}
          {isGitHubConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <LevelComputingBanner />
            </motion.div>
          )}
        </div>

        {/* Section 2: Goals */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl font-semibold text-[#1A1A1A] mb-2">
              What are your goals?
            </h2>
            <p className="text-[#6B7280]">Select what you want to achieve</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {GOALS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`goal-card p-4 rounded-2xl border-2 text-left cursor-pointer ${
                    isSelected
                      ? 'selected border-[#7A8EC0] bg-[#ECEDF2]'
                      : 'border-[#E5E5E3] bg-white hover:border-[#D4D4D0]'
                  }`}
                >
                <span className={`mb-2 block ${isSelected ? 'text-[#7A8EC0]' : 'text-[#9CA3AF]'}`}>
                  {GOAL_ICONS[goal.id]}
                </span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-[#7A8EC0]' : 'text-[#4B5563]'}`}>
                    {goal.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-[#6B7280] text-center mt-3">
            {selectedGoals.length}/5 goals selected
          </p>
        </div>

        {error && (
          <p className="text-sm text-[#DC2626] text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={isLoading || !isGitHubConnected || selectedGoals.length === 0}
            className="w-full py-3.5 rounded-full bg-[#7A8EC0] text-white font-semibold text-[15px] hover:bg-[#6A7EB0] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              'Finish Setup'
            )}
          </button>
        </form>
      </motion.div>
    </>
  );
}
