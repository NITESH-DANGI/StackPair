'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const features = [
  {
    title: 'Learn Mode',
    desc: 'AI-matched peer sessions with auto-generated notes.',
    color: '#7A8EC0',
    size: 'lg' as const,
    visual: (
      <div className="flex items-end gap-1 h-20 mt-4">
        {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(122,142,192,0.1), rgba(122,142,192,${0.3 + i * 0.08}))` }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.06 }}
          />
        ))}
      </div>
    ),
  },
  {
    title: 'Build Mode',
    desc: 'Find co-builders. Ship projects. Publish Build Stories.',
    color: '#22C55E',
    size: 'sm' as const,
    visual: (
      <div className="flex gap-2 mt-4">
        {['Frontend', 'Backend', 'Design'].map((role) => (
          <div key={role} className="flex-1 bg-[#22C55E]/[0.06] border border-[#22C55E]/10 rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#22C55E]/60">{role}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Showcase',
    desc: 'Get discovered by startups based on what you built.',
    color: '#8B5CF6',
    size: 'sm' as const,
    visual: (
      <div className="flex items-center gap-2 mt-4">
        <div className="flex -space-x-2">
          {['#6366F1', '#EC4899', '#F59E0B'].map((c, i) => (
            <div key={i} className="w-6 h-6 rounded-full border border-[#131316]" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-[10px] text-white/20">3 startups viewed</span>
      </div>
    ),
  },
  {
    title: 'AI Skill Verification',
    desc: 'No self-reporting. Your level is computed from real platform data across GitHub, LeetCode, Kaggle, and more.',
    color: '#F59E0B',
    size: 'lg' as const,
    visual: (
      <div className="flex gap-3 mt-4">
        {[
          { name: 'GitHub', pct: 35 },
          { name: 'LeetCode', pct: 25 },
          { name: 'Kaggle', pct: 15 },
        ].map((p) => (
          <div key={p.name} className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/30">{p.name}</span>
              <span className="text-white/20">{p.pct}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#F59E0B]/40"
                initial={{ width: 0 }}
                whileInView={{ width: `${p.pct * 2.5}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Bridge Points',
    desc: 'Earn points for guiding sessions. Unlock premium features.',
    color: '#06B6D4',
    size: 'sm' as const,
    visual: (
      <div className="flex items-center gap-2 mt-4">
        <div className="text-2xl font-bold text-[#06B6D4]/60">⬡</div>
        <div>
          <p className="text-sm font-bold text-white/60">600</p>
          <p className="text-[10px] text-white/20">points earned</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Portfolio Card',
    desc: 'Generate your shareable dev card in 30 seconds.',
    color: '#EC4899',
    size: 'sm' as const,
    visual: (
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2 mt-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 flex items-center justify-center text-[10px] text-white/50 font-bold">RS</div>
        <div>
          <p className="text-[11px] text-white/50 font-medium">Rahul S.</p>
          <p className="text-[9px] text-white/20">Level 3 · TypeScript</p>
        </div>
      </div>
    ),
  },
];

export default function BentoFeatures() {
  return (
    <section id="modes" className="relative py-32 sm:py-40">
      <div className="absolute inset-0 dot-pattern" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            className="text-xs font-medium text-[#7A8EC0] uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Platform
          </motion.p>
          <motion.h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Everything you need.
            <br />
            <span className="text-white/30">Nothing you don&apos;t.</span>
          </motion.h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={`bento-card p-6 sm:p-7 rounded-2xl relative overflow-hidden ${f.size === 'lg' ? 'md:col-span-2 lg:col-span-2' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Accent dot */}
              <div className="w-2 h-2 rounded-full mb-5" style={{ backgroundColor: f.color }} />

              <h3 className="text-lg font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-white/30 leading-relaxed">{f.desc}</p>

              {/* Visual element */}
              {f.visual}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm text-[#7A8EC0] hover:text-[#9BA8D4] transition-colors font-medium"
          >
            Explore all features
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
