'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import type { OnboardingStateResponse, OnboardingState } from '@/lib/types/auth';

/** Map backend onboarding state to the correct step URL */
function stateToRoute(state: OnboardingState): string {
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

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auth guard: redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    // Fetch current onboarding state and redirect if needed
    (async () => {
      try {
        const { onboarding_state } = await api<OnboardingStateResponse>(
          '/onboarding/state',
          { method: 'GET' },
        );

        const correctRoute = stateToRoute(onboarding_state);
        const currentPath = window.location.pathname;

        // If user is ACTIVE, send them to dashboard
        if (onboarding_state === 'ACTIVE') {
          router.replace('/dashboard');
          return;
        }

        // If the user is on the wrong step, redirect
        if (!currentPath.startsWith(correctRoute)) {
          router.replace(correctRoute);
          return;
        }

        setReady(true);
      } catch {
        // If we can't get onboarding state, show the page anyway
        setReady(true);
      }
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7A8EC0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="w-full max-w-2xl mx-auto px-6 py-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <Logo size="md" />
        </div>

        {children}
      </div>
    </div>
  );
}
