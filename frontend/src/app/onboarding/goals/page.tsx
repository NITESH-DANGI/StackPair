'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { TargetIcon, LayoutIcon, BriefcaseIcon, GlobeIcon, MicIcon, RocketIcon, HandshakeIcon } from '@/components/ui/Icons';
import { GOALS } from '@/lib/types/auth';
import { api, ApiError } from '@/lib/api';
import type { OnboardingStateResponse } from '@/lib/types/auth';
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

// Common timezones for Indian users
const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Malayalam',
  'Punjabi',
];

export default function GoalsPage() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : prev.length < 5
        ? [...prev, goalId]
        : prev
    );
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedGoals.length === 0) {
      setError('Please select at least 1 goal');
      return;
    }

    setIsLoading(true);
    try {
      await api<OnboardingStateResponse>('/onboarding/goals', {
        method: 'POST',
        body: {
          goals: selectedGoals,
          timezone,
          languages: selectedLanguages.length > 0 ? selectedLanguages : null,
        },
      });
      window.location.href = '/onboarding/welcome';
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.detail === 'INVALID_ONBOARDING_STATE') {
          setError('This step has already been completed.');
        } else {
          setError(err.detail);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
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
        {/* Section 1: Goals */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
              What are your goals?
            </h1>
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

        {/* Section 2: Timezone */}
        <div className="mb-8">
          <label htmlFor="timezone" className="block text-sm font-medium text-[#4B5563] mb-1.5">
            Your Timezone <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-[#E5E5E3] bg-white text-[15px] text-[#1A1A1A] transition-all duration-200 outline-none hover:border-[#D4D4D0] focus:border-[#7A8EC0] cursor-pointer"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Section 3: Languages */}
        <div className="mb-8">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-[#4B5563] mb-1.5">
              Languages you speak <span className="text-[#9CA3AF] font-normal">(optional)</span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'bg-[#7A8EC0] text-white'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB] hover:text-[#1A1A1A]'
                    }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#DC2626] text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={isLoading || selectedGoals.length === 0}
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
