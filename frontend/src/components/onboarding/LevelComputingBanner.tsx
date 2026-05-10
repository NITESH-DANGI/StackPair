'use client';

import { BrainIcon, PartyIcon } from '@/components/ui/Icons';

interface LevelComputingBannerProps {
  primarySkill?: string | null;
  skillLevel?: number | null;
}

export default function LevelComputingBanner({ primarySkill, skillLevel }: LevelComputingBannerProps) {
  if (primarySkill) {
    return (
      <div className="w-full p-4 rounded-2xl bg-[#D1FAE5] border border-[#059669]/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#059669]/10 flex items-center justify-center shrink-0">
          <PartyIcon className="text-[#059669]" size={22} />
        </div>
        <div>
          <p className="font-semibold text-[#065F46]">
            Your primary skill: {primarySkill}
            {skillLevel !== null && skillLevel !== undefined && ` — Level ${skillLevel}`}
          </p>
          <p className="text-sm text-[#047857] mt-0.5">
            Your skill level has been verified!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-2xl bg-[#FEF3C7] border border-[#D97706]/20 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 flex items-center justify-center shrink-0 animate-gentle-pulse">
        <BrainIcon className="text-[#92400E]" size={22} />
      </div>
      <div>
        <p className="font-semibold text-[#92400E]">
          Analysing your GitHub — skill level coming soon
        </p>
        <p className="text-sm text-[#B45309] mt-0.5">
          This usually takes about 2 minutes
        </p>
      </div>
    </div>
  );
}
