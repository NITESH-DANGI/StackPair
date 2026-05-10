'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedText from '@/components/magicui/AnimatedText';
import ModeCard from './ModeCard';

const modes = [
  {
    mode: 'learn' as const,
    headline: 'Learn from someone who just figured it out',
    body: 'Swipe through developers who recently mastered your target skill. Match on level. Book a 30-min session. AI takes notes and generates a summary.',
    features: [
      'AI-verified skill matching',
      '30-min focused video sessions',
      'Auto-generated session notes',
      'Bridge Points for every session you guide',
    ],
    cta: 'Start Learning',
    accentColor: '#7A8EC0',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    mode: 'build' as const,
    headline: 'Build real things with the right co-founder',
    body: 'Post your project idea. Get matched with developers whose skills complement yours. Ship together. Publish your Build Story.',
    features: [
      'Skill-complementary matching',
      'Shared project board',
      'Community Showcase with Build Stories',
      '70% revenue to the team on unlocks',
    ],
    cta: 'Start Building',
    accentColor: '#059669',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    mode: 'showcase' as const,
    headline: 'Get discovered for what you built — not what you claim',
    body: 'Your completed projects live on StackPair Showcase. Startups and hiring teams find you by skill, level, and project type.',
    features: [
      'Passive discovery — toggle on when open',
      'Project-based signal, not resume',
      'Startup direct access at ₹199',
      'No job listings, no recruiter spam',
    ],
    cta: 'Get Discovered',
    accentColor: '#8B5CF6',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 10-16 0" /><path d="M12 13v3M9 19l3-3 3 3" />
      </svg>
    ),
  },
];

export default function ModesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="modes" className="bg-[#F5F5F0] py-24 sm:py-32" ref={ref}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.p
            className="text-xs font-semibold text-[#7A8EC0] uppercase tracking-[0.15em] mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            Modes
          </motion.p>
          <AnimatedText
            text="Three modes. One platform."
            as="h2"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#1A1A1A]"
          />
        </div>

        {/* Cards — Bento-style layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Learn card — full width on first row */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <ModeCard {...modes[0]} variant="horizontal" />
          </motion.div>

          {/* Build + Showcase — share bottom row */}
          {modes.slice(1).map((m, i) => (
            <motion.div
              key={m.mode}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
            >
              <ModeCard {...m} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
