'use client';

import type { OnboardingState } from '@/lib/types/auth';

interface StepIndicatorProps {
  currentState: OnboardingState;
}

const STEPS = [
  { key: 'profile', label: 'Profile' },
  { key: 'skills', label: 'Skills' },
  { key: 'platforms', label: 'Platforms' },
  { key: 'welcome', label: 'Welcome' },
];

const STATE_TO_STEP: Record<OnboardingState, number> = {
  REGISTERED: 0,
  PROFILE_COMPLETE: 1,
  SKILLS_SET: 2,
  GOALS_SET: 3,
  ACTIVE: 3,
};

export default function StepIndicator({ currentState }: StepIndicatorProps) {
  const activeStep = STATE_TO_STEP[currentState];

  return (
    <div className="w-full max-w-md mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-[#E5E5E3]" />
        {/* Progress line */}
        <div
          className="absolute top-4 left-8 h-0.5 bg-[#7A8EC0] transition-all duration-500 ease-out"
          style={{ width: `${(activeStep / (STEPS.length - 1)) * (100 - 16)}%` }}
        />

        {STEPS.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isFuture = index > activeStep;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              {/* Step circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#059669] text-white'
                    : isActive
                    ? 'bg-[#7A8EC0] text-white shadow-md shadow-gray-300'
                    : 'bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E5E3]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isCompleted
                    ? 'text-[#059669]'
                    : isActive
                    ? 'text-[#7A8EC0]'
                    : 'text-[#9CA3AF]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
