'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import Logo from '@/components/ui/Logo';
import type { OnboardingState } from '@/lib/types/auth';

/** Map onboarding state to the correct frontend route */
function getOnboardingRoute(state: OnboardingState): string {
  switch (state) {
    case 'REGISTERED':
      return '/onboarding/profile';
    case 'PROFILE_COMPLETE':
      return '/onboarding/skills';
    case 'SKILLS_SET':
      return '/onboarding/goals';
    case 'GOALS_SET':
      return '/onboarding/welcome';
    case 'ACTIVE':
      return '/dashboard';
    default:
      return '/onboarding/profile';
  }
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const handleOAuthCallback = useAuthStore((s) => s.handleOAuthCallback);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    // Determine provider from URL or default to github
    // Supabase typically redirects back with code in the URL
    // We detect the provider from a stored value or from the URL pattern
    const provider = sessionStorage.getItem('stackpair_oauth_provider') || 'github';

    if (!code) {
      setError('No authorization code received. Please try logging in again.');
      return;
    }

    (async () => {
      try {
        const result = await handleOAuthCallback(provider, code, state || undefined);
        // Clear stored provider
        sessionStorage.removeItem('stackpair_oauth_provider');
        // Redirect based on onboarding state
        const route = getOnboardingRoute(result.user.onboarding_state);
        window.location.href = route;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'OAuth login failed';
        setError(message);
      }
    })();
  }, [searchParams, handleOAuthCallback]);

  if (error) {
    return (
      <div className="min-h-screen auth-gradient flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo size="md" />
          </div>
          <div className="card-elevated p-8">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#1A1A1A] mb-2">
              Login Failed
            </h2>
            <p className="text-[#6B7280] mb-6">{error}</p>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#7A8EC0] text-white font-semibold text-sm hover:bg-[#6A7EB0] transition-all"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-8">
          <Logo size="md" />
        </div>
        <div className="card-elevated p-8">
          <div className="w-12 h-12 rounded-full bg-[#ECEDF2] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#7A8EC0] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#1A1A1A] mb-2">
            Completing login...
          </h2>
          <p className="text-[#6B7280]">Please wait while we verify your account</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen auth-gradient flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7A8EC0] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
