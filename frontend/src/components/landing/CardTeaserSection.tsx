'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import InteractiveCard from '@/components/magicui/InteractiveCard';

export default function CardTeaserSection() {
  return (
    <section id="card" className="relative py-32 sm:py-40 border-t border-white/[0.04]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-medium text-[#EC4899] uppercase tracking-[0.2em] mb-4">Portfolio Card</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
              One card.
              <br />
              <span className="text-white/30">All your signal.</span>
            </h2>
            <p className="text-base text-white/30 leading-relaxed mb-8 max-w-[400px]">
              Generate your shareable dev card with verified skills and GitHub stats.
              Free. 30 seconds.
            </p>

            <Link
              href="/card"
              className="group inline-flex items-center gap-2 rounded-full font-semibold text-[15px] px-7 py-3 bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] transition-all duration-300"
            >
              Generate My Card
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>

          {/* Right — Card visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <InteractiveCard className="rounded-2xl max-w-[360px] w-full" glowColor="rgba(236, 72, 153, 0.12)" tiltIntensity={10}>
              <div className="bg-[#0F0F12] rounded-2xl p-6 border border-white/[0.06] glow-accent">
                {/* Header */}
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7A8EC0]/20 to-[#8B5CF6]/20 flex items-center justify-center text-white/60 font-semibold text-sm">RS</div>
                  <div>
                    <p className="text-white font-semibold">Rahul S.</p>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#7A8EC0] font-medium bg-[#7A8EC0]/10 px-2 py-0.5 rounded-full mt-0.5">
                      Level 3 · TypeScript
                    </span>
                  </div>
                </div>

                {/* GitHub graph */}
                <div className="mb-5">
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2">Contributions</p>
                  <div className="grid grid-cols-12 gap-[3px]">
                    {[0,0.3,0.15,0.8,0,0.5,0.15,0,0.3,0.8,0.5,0,0.15,0.8,0,0.3,0.5,0.15,0,0.8,0,0.3,0.5,0.15,0.8,0,0.15,0.5,0,0.3,0.8,0.15,0,0.5,0.3,0.8,0,0.15,0.5,0,0.3,0.8,0.15,0.5,0,0.3,0,0.8].map((v, i) => (
                      <div key={i} className="aspect-square rounded-[2px]" style={{ backgroundColor: v > 0 ? `rgba(34,197,94,${v})` : 'rgba(255,255,255,0.03)' }} />
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[{ v: '450', l: 'LC Solved' }, { v: '1.2k', l: 'Commits' }, { v: '8', l: 'Projects' }].map(s => (
                    <div key={s.l} className="bg-white/[0.03] rounded-lg p-2.5 text-center border border-white/[0.03]">
                      <p className="text-white font-bold text-sm">{s.v}</p>
                      <p className="text-white/15 text-[9px] uppercase tracking-wider">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {['TypeScript', 'React', 'Node.js', 'PostgreSQL'].map(t => (
                    <span key={t} className="text-[10px] text-white/25 bg-white/[0.03] px-2 py-1 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
