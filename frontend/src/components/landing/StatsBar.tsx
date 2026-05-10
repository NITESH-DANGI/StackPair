'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NumberTicker from '@/components/magicui/NumberTicker';

interface StatItem {
  label: string;
  value: number;
  suffix: string;
  decimals?: number;
  icon: React.ReactNode;
}

const stats: StatItem[] = [
  {
    label: 'Active Developers',
    value: 1200,
    suffix: '+',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Sessions Completed',
    value: 3400,
    suffix: '+',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="m10 9 5 3-5 3V9zM2 20h20" />
      </svg>
    ),
  },
  {
    label: 'Skills Verified',
    value: 4800,
    suffix: '+',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Projects Built',
    value: 280,
    suffix: '+',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    label: 'Avg. Rating',
    value: 4.8,
    suffix: '/5',
    decimals: 1,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-[#7A8EC0] py-5 relative overflow-hidden">
      {/* Subtle geometric pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-white/20 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="flex flex-col items-center text-center py-5 px-3"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <div className="text-white/70 mb-2.5">{stat.icon}</div>
            <p className="text-white text-2xl sm:text-3xl font-semibold mb-1">
              <NumberTicker
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals || 0}
                delay={i * 0.15}
              />
            </p>
            <p className="text-white/60 text-xs sm:text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
