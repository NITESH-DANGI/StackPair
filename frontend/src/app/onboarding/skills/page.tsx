'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import SkillTagSelector from '@/components/onboarding/SkillTagSelector';

export default function SkillsPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (skills.length === 0) {
      setError('Please select at least 1 skill');
      return;
    }

    setIsLoading(true);
    try {
      // In production: PATCH /onboarding/skills
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.href = '/onboarding/platforms';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StepIndicator currentState="PROFILE_COMPLETE" />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
            What are your skills?
          </h1>
          <p className="text-[#6B7280]">Select up to 5 technologies you work with</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SkillTagSelector
            value={skills}
            onChange={(newSkills) => { setSkills(newSkills); setError(null); }}
            maxItems={5}
          />

          {error && (
            <p className="text-sm text-[#DC2626] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || skills.length === 0}
            className="w-full py-3.5 rounded-full bg-[#7A8EC0] text-white font-semibold text-[15px] hover:bg-[#6A7EB0] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </motion.div>
    </>
  );
}
