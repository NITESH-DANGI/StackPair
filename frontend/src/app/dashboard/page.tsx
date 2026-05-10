'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { isAuthenticated } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import type { User, VerificationStatus, PlatformHandle } from '@/lib/types/auth';
import { PLATFORMS } from '@/lib/types/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export default function DashboardPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [user, setUser] = useState<User | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Platform handles state
  const [platformHandles, setPlatformHandles] = useState<Record<string, string>>({});
  const [isSavingPlatforms, setIsSavingPlatforms] = useState(false);
  const [platformMessage, setPlatformMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const userData = await api<User>('/users/me', { method: 'GET' });
        setUser(userData);

        // Redirect if not ACTIVE
        if (userData.onboarding_state !== 'ACTIVE') {
          router.replace('/onboarding/profile');
          return;
        }

        // Fetch verification status (may 404 if no run yet)
        try {
          const status = await api<VerificationStatus>('/users/me/verification-status', { method: 'GET' });
          setVerification(status);
        } catch {
          // No verification run yet — that's OK
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  const handlePlatformChange = useCallback((platformId: string, handle: string) => {
    setPlatformHandles(prev => {
      if (!handle) {
        const next = { ...prev };
        delete next[platformId];
        return next;
      }
      return { ...prev, [platformId]: handle };
    });
  }, []);

  const savePlatforms = async () => {
    setIsSavingPlatforms(true);
    setPlatformMessage(null);
    try {
      const handles: PlatformHandle[] = Object.entries(platformHandles)
        .filter(([, handle]) => handle.trim())
        .map(([platform, handle]) => ({ platform, handle: handle.trim() }));

      if (handles.length === 0) {
        setPlatformMessage('Please enter at least one platform handle');
        setIsSavingPlatforms(false);
        return;
      }

      const result = await api<{ message: string }>('/users/me/platforms', {
        method: 'PUT',
        body: { handles },
      });
      setPlatformMessage(result.message);
    } catch (err) {
      setPlatformMessage(err instanceof ApiError ? err.detail : 'Failed to save platforms');
    } finally {
      setIsSavingPlatforms(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7A8EC0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="card-elevated p-8 max-w-md w-full text-center">
          <p className="text-[#DC2626] mb-4">{error}</p>
          <a href="/login" className="text-[#7A8EC0] font-medium hover:text-[#6A7EB0]">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E5E5E3] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6B7280]">
              {user?.display_name || user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-[#9CA3AF] hover:text-[#DC2626] transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-semibold text-[#1A1A1A] mb-2">
            Welcome, {user?.display_name || 'Developer'}!
          </h1>
          <p className="text-[#6B7280] mb-8">Manage your profile and platform connections.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Card */}
            <div className="card-elevated p-6">
              <h2 className="font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7A8EC0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Username</span>
                  <span className="text-[#1A1A1A] font-medium">@{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Email</span>
                  <span className="text-[#1A1A1A] font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Role</span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#ECEDF2] text-[#7A8EC0]">
                    {user?.role}
                  </span>
                </div>
                {user?.bio && (
                  <div>
                    <span className="text-[#6B7280] block mb-1">Bio</span>
                    <span className="text-[#1A1A1A]">{user.bio}</span>
                  </div>
                )}
                {user?.profile?.secondary_skills && user.profile.secondary_skills.length > 0 && (
                  <div>
                    <span className="text-[#6B7280] block mb-1">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.profile.secondary_skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 rounded-full bg-[#F3F4F6] text-xs text-[#4B5563] font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="card-elevated p-6">
              <h2 className="font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7A8EC0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Skill Verification
              </h2>
              {verification ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Status</span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      verification.status === 'COMPLETE' ? 'bg-[#D1FAE5] text-[#059669]' :
                      verification.status === 'RUNNING' ? 'bg-[#FEF3C7] text-[#D97706]' :
                      verification.status === 'FAILED' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                      'bg-[#F3F4F6] text-[#6B7280]'
                    }`}>
                      {verification.status}
                    </span>
                  </div>
                  {verification.normalised_primary_skill && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Primary Skill</span>
                      <span className="text-[#1A1A1A] font-medium">{verification.normalised_primary_skill}</span>
                    </div>
                  )}
                  {verification.assigned_level !== null && verification.assigned_level !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Skill Level</span>
                      <span className="text-[#1A1A1A] font-semibold text-lg">{verification.assigned_level}/5</span>
                    </div>
                  )}
                  {verification.final_score !== null && verification.final_score !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Score</span>
                      <span className="text-[#1A1A1A] font-medium">{verification.final_score.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-[#6B7280] mb-2">No verification run yet</p>
                  <p className="text-xs text-[#9CA3AF]">Connect your platforms below to get verified</p>
                </div>
              )}
            </div>
          </div>

          {/* Platform Handles */}
          <div className="card-elevated p-6 mt-6">
            <h2 className="font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#7A8EC0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Connect Platforms
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              Link your developer accounts to verify your skills. GitHub is required.
            </p>

            <div className="space-y-3">
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center gap-3">
                  <label className="w-32 text-sm font-medium text-[#4B5563] flex items-center gap-2 shrink-0">
                    {platform.name}
                    {platform.required && (
                      <span className="text-[10px] font-semibold text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded">REQ</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={platformHandles[platform.id] || ''}
                    onChange={(e) => handlePlatformChange(platform.id, e.target.value)}
                    placeholder={platform.id === 'portfolio' ? 'https://your-site.com' : `Your ${platform.name} username`}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#E5E5E3] bg-white text-sm transition-all duration-200 outline-none hover:border-[#D4D4D0] focus:border-[#7A8EC0]"
                  />
                </div>
              ))}
            </div>

            {platformMessage && (
              <p className={`mt-3 text-sm ${platformMessage.includes('Updated') ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                {platformMessage}
              </p>
            )}

            <button
              onClick={savePlatforms}
              disabled={isSavingPlatforms}
              className="mt-4 px-6 py-2.5 rounded-full bg-[#7A8EC0] text-white font-medium text-sm hover:bg-[#6A7EB0] transition-all duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSavingPlatforms ? 'Saving...' : 'Save Platforms'}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
