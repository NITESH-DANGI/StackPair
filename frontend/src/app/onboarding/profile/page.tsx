'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { api, ApiError } from '@/lib/api';
import type { OnboardingStateResponse } from '@/lib/types/auth';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) return;
    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameStatus('idle');
      setErrors(prev => ({ ...prev, username: 'Only lowercase letters, numbers, and underscores' }));
      return;
    }

    setUsernameStatus('checking');
    setErrors(prev => { const next = { ...prev }; delete next.username; return next; });

    // We don't have a dedicated username check endpoint, so we'll validate on submit
    // For now, mark as available if pattern is valid
    setUsernameStatus('available');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!displayName || displayName.length < 2) newErrors.displayName = 'Display name must be at least 2 characters';
    if (displayName.length > 60) newErrors.displayName = 'Display name is too long (max 60)';
    if (!username || username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (username.length > 30) newErrors.username = 'Username is too long (max 30)';
    if (!/^[a-z0-9_]+$/.test(username)) newErrors.username = 'Only lowercase letters, numbers, and underscores';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api<OnboardingStateResponse>('/onboarding/profile', {
        method: 'POST',
        body: {
          username,
          display_name: displayName,
          avatar_url: null,
        },
      });
      window.location.href = '/onboarding/skills';
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.detail === 'USERNAME_TAKEN') {
          setErrors({ username: `Username "${username}" is taken. Try another one.` });
          setUsernameStatus('taken');
        } else if (err.detail === 'INVALID_ONBOARDING_STATE') {
          setErrors({ submit: 'This step has already been completed.' });
        } else {
          setErrors({ submit: err.detail });
        }
      } else {
        setErrors({ submit: 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = displayName.length >= 2 && username.length >= 3 && /^[a-z0-9_]+$/.test(username);

  return (
    <>
      <StepIndicator currentState="REGISTERED" />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
            Set up your profile
          </h1>
          <p className="text-[#6B7280]">Tell us a bit about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar upload */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              className="w-24 h-24 rounded-full border-2 border-dashed border-[#D4D4D0] flex flex-col items-center justify-center gap-1 hover:border-[#7A8EC0] hover:bg-[#ECEDF2] transition-all duration-200 cursor-pointer group"
            >
              <svg className="w-6 h-6 text-[#9CA3AF] group-hover:text-[#7A8EC0] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="text-[10px] text-[#9CA3AF] group-hover:text-[#7A8EC0]">Upload</span>
            </button>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-[#4B5563] mb-1.5">
              Display Name <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setErrors(prev => { const next = { ...prev }; delete next.displayName; return next; }); }}
              placeholder="Your name"
              maxLength={60}
              className={`w-full px-4 py-3.5 rounded-xl border text-[15px] transition-all duration-200 outline-none
                ${errors.displayName ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E5E3] bg-white hover:border-[#D4D4D0] focus:border-[#7A8EC0]'}`}
              aria-invalid={!!errors.displayName}
            />
            {errors.displayName && <p className="mt-1.5 text-sm text-[#DC2626]">{errors.displayName}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#4B5563] mb-1.5">
              Username <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[15px]">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setUsername(val);
                  setUsernameStatus('idle');
                  setErrors(prev => { const next = { ...prev }; delete next.username; return next; });
                }}
                onBlur={() => username.length >= 3 && checkUsername(username)}
                placeholder="your_username"
                maxLength={30}
                className={`w-full pl-9 pr-12 py-3.5 rounded-xl border text-[15px] transition-all duration-200 outline-none
                  ${errors.username ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E5E3] bg-white hover:border-[#D4D4D0] focus:border-[#7A8EC0]'}`}
                aria-invalid={!!errors.username}
              />
              {/* Status indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && (
                  <svg className="w-5 h-5 animate-spin text-[#9CA3AF]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
                {usernameStatus === 'available' && (
                  <svg className="w-5 h-5 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {usernameStatus === 'taken' && (
                  <svg className="w-5 h-5 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            </div>
            {usernameStatus === 'available' && !errors.username && (
              <p className="mt-1.5 text-sm text-[#059669] flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Username looks good
              </p>
            )}
            {errors.username && <p className="mt-1.5 text-sm text-[#DC2626]">{errors.username}</p>}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[#4B5563] mb-1.5">
              Bio <span className="text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={280}
              className="w-full px-4 py-3.5 rounded-xl border border-[#E5E5E3] bg-white text-[15px] transition-all duration-200 outline-none hover:border-[#D4D4D0] focus:border-[#7A8EC0] resize-none"
            />
            <p className="text-right text-xs text-[#9CA3AF] mt-1">{bio.length}/280</p>
          </div>

          {errors.submit && (
            <p className="text-sm text-[#DC2626] text-center">{errors.submit}</p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
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
