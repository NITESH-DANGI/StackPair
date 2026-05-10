'use client';

import React from 'react';
import Image from 'next/image';
import type { PlatformInfo } from '@/lib/types/auth';
import { LeetCodeIcon, BarChartIcon, BookOpenIcon, BoltIcon } from '@/components/ui/Icons';

interface PlatformConnectCardProps {
  platform: PlatformInfo;
  isConnected: boolean;
  platformUsername?: string;
  onConnect: () => void;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  github: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1A1A1A">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  leetcode: (
    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FFA116]/10">
      <LeetCodeIcon className="text-[#FFA116]" size={20} />
    </div>
  ),
  kaggle: (
    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#20BEFF]/10">
      <BarChartIcon className="text-[#20BEFF]" size={20} />
    </div>
  ),
  stackoverflow: (
    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F48024]/10">
      <BookOpenIcon className="text-[#F48024]" size={20} />
    </div>
  ),
  codeforces: (
    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1F8ACB]/10">
      <BoltIcon className="text-[#1F8ACB]" size={20} />
    </div>
  ),
};

export default function PlatformConnectCard({ platform, isConnected, platformUsername, onConnect }: PlatformConnectCardProps) {
  return (
    <div
      className={`platform-card flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
        isConnected
          ? 'border-[#059669]/30 bg-[#F0FDF4]'
          : 'border-[#E5E5E3] bg-white hover:border-[#D4D4D0]'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Platform icon */}
        {PLATFORM_ICONS[platform.id]}

        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A1A1A]">{platform.name}</span>
            {platform.required && (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#FEF3C7] text-[#92400E]">
                Required
              </span>
            )}
            {!platform.required && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#F3F4F6] text-[#6B7280]">
                Optional
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {isConnected
              ? `Connected as @${platformUsername || 'user'}`
              : `Contributes ${platform.weight}% to your skill level`
            }
          </p>
        </div>
      </div>

      {/* Connect / Connected button */}
      {isConnected ? (
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#059669]/10 text-[#059669] font-medium text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Connected
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="px-5 py-2.5 rounded-full border-2 border-[#7A8EC0] text-[#7A8EC0] font-medium text-sm hover:bg-[#7A8EC0] hover:text-white transition-all duration-200 cursor-pointer"
        >
          Connect
        </button>
      )}
    </div>
  );
}
