'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import InteractiveCard from '@/components/magicui/InteractiveCard';

interface ModeCardProps {
  mode: 'learn' | 'build' | 'showcase';
  headline: string;
  body: string;
  features: string[];
  cta: string;
  accentColor: string;
  icon: React.ReactNode;
  variant?: 'default' | 'horizontal';
}

export default function ModeCard({ mode, headline, body, features, cta, accentColor, icon, variant = 'default' }: ModeCardProps) {
  const isHorizontal = variant === 'horizontal';

  return (
    <InteractiveCard
      className="rounded-2xl h-full"
      glowColor={`${accentColor}20`}
      tiltIntensity={5}
    >
      <div
        className={`bg-white rounded-2xl border border-[#E5E5E3] hover:border-[#D4D4D0] transition-all duration-300 flex flex-col group shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] h-full ${
          isHorizontal ? 'lg:flex-row lg:items-center' : ''
        }`}
        style={{ borderTopColor: accentColor, borderTopWidth: '3px' }}
      >
        <div className={`p-8 sm:p-10 flex flex-col flex-1 ${isHorizontal ? 'lg:pr-0' : ''}`}>
          {/* Mode label */}
          <span
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-5"
            style={{ color: accentColor }}
          >
            {mode} Mode
          </span>

          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
          >
            {icon}
          </div>

          <h3 className="text-[#1A1A1A] font-semibold text-xl mb-3 leading-snug">{headline}</h3>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-6">{body}</p>

          {/* CTA */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="mt-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm px-6 py-3 transition-all duration-300 text-white"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 16px ${accentColor}30`,
              }}
            >
              {cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Features — side panel for horizontal, below for vertical */}
        <div className={`px-8 sm:px-10 pb-8 sm:pb-10 ${isHorizontal ? 'lg:py-10 lg:px-10 lg:border-l lg:border-[#E5E5E3] lg:max-w-[400px]' : 'pt-0'}`}>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Key Features</p>
          <ul className="space-y-3">
            {features.map((feature, fi) => (
              <motion.li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-[#4B5563]"
                initial={{ opacity: 0.6 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: fi * 0.05 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.5"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {feature}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </InteractiveCard>
  );
}
