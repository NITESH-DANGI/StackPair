'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Particles from '@/components/magicui/Particles';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090B] overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 grid-pattern" />
      <Particles quantity={30} color="122, 142, 192" size={1.5} speed={0.15} mouseInfluence={80} />

      {/* Content */}
      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center pt-32 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] text-white/60 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse" />
            Now in Early Access
          </span>
        </motion.div>

        {/* Massive headline */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold text-white leading-[1.05] tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Find your perfect
          <br />
          <span className="bg-gradient-to-r from-[#7A8EC0] via-[#9BA8D4] to-[#8B5CF6] bg-clip-text text-transparent">
            dev partner
          </span>
        </motion.h1>

        {/* Short subtext — max 2 lines */}
        <motion.p
          className="text-lg sm:text-xl text-white/40 max-w-[520px] mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          AI-verified skill matching. 30-minute peer sessions.
          Real projects, real growth.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 rounded-full font-semibold text-[15px] px-8 py-3.5 bg-[#7A8EC0] text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(122,142,192,0.4)] hover:scale-[1.02]"
          >
            Get Started Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full font-medium text-[15px] px-8 py-3.5 text-white/60 border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/80 transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            How It Works
          </a>
        </motion.div>

        <motion.p
          className="text-xs text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          No credit card · Free forever tier · 3 min setup
        </motion.p>
      </div>

      {/* Hero visual — Full-width product mockup */}
      <motion.div
        className="relative z-10 w-full max-w-[1100px] mx-auto px-6"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="relative gradient-border glow-accent">
          {/* Mockup: Match interface */}
          <div className="bg-[#0F0F12] rounded-2xl p-1 sm:p-1.5 border border-white/[0.06]">
            <div className="bg-[#131316] rounded-xl overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
                  <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
                  <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white/[0.04] rounded-md px-12 py-1 text-[11px] text-white/20">stackpair.app/match</div>
                </div>
              </div>

              {/* Match interface mockup */}
              <div className="p-6 sm:p-10 flex flex-col lg:flex-row gap-6">
                {/* Left — Swipe cards */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-full max-w-[320px]">
                    {/* Background card */}
                    <div className="absolute top-3 left-3 right-3 bottom-0 bg-white/[0.02] rounded-2xl border border-white/[0.04] transform rotate-2" />

                    {/* Main card */}
                    <div className="relative bg-white/[0.04] rounded-2xl border border-white/[0.06] p-6">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-[11px] font-semibold text-[#7A8EC0] uppercase tracking-wider">94% Match</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-[#22C55E]">
                          <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse" />
                          Online
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7A8EC0]/30 to-[#8B5CF6]/30 flex items-center justify-center text-white/70 font-semibold text-sm">AK</div>
                        <div>
                          <p className="text-white font-semibold">Arjun K.</p>
                          <p className="text-white/30 text-sm">SDE-2 · Bengaluru</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {['React', 'TypeScript', 'System Design'].map(s => (
                          <span key={s} className="text-[11px] text-white/40 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.04]">{s}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">247</p>
                          <p className="text-white/20 text-[10px]">Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">4.9</p>
                          <p className="text-white/20 text-[10px]">Rating</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">L3</p>
                          <p className="text-white/20 text-[10px]">Level</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — Stats dashboard */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="bento-card p-4 rounded-xl col-span-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Skill Levels</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[30, 55, 80, 95, 60, 75].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{ height: `${h}%`, background: `rgba(122, 142, 192, ${0.2 + i * 0.12})` }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 1 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bento-card p-4 rounded-xl">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Active</p>
                    <p className="text-2xl font-bold text-white">1.2k</p>
                    <p className="text-[10px] text-[#22C55E]">+12% this week</p>
                  </div>

                  <div className="bento-card p-4 rounded-xl">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Sessions</p>
                    <p className="text-2xl font-bold text-white">3.4k</p>
                    <p className="text-[10px] text-[#7A8EC0]">30 min avg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
      </motion.div>
    </section>
  );
}
