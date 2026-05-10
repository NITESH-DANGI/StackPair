'use client';

import Logo from '@/components/ui/Logo';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
