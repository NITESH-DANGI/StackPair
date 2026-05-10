'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const levels = [
  { level: 0, label: 'Getting Started', color: '#6B7280', pct: 5 },
  { level: 1, label: 'Foundations', color: '#22C55E', pct: 20 },
  { level: 2, label: 'Developing', color: '#4ADE80', pct: 40 },
  { level: 3, label: 'Competent', color: '#7A8EC0', pct: 60 },
  { level: 4, label: 'Advanced', color: '#8B5CF6', pct: 85 },
  { level: 5, label: 'Expert', color: '#F59E0B', pct: 98 },
];

export default function VerificationSection() {
  const [activeLevel, setActiveLevel] = useState(3);

  return (
    <section id="verify" className="relative py-32 sm:py-40 border-t border-white/[0.04]">
      <div className="absolute inset-0 section-glow" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Interactive level meter */}
            <div className="bento-card p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-white/40">Your Skill Level</p>
                <span className="text-xs text-white/20 bg-white/[0.04] px-3 py-1 rounded-full">AI-verified</span>
              </div>

              {/* Level bars */}
              <div className="space-y-3">
                {levels.map((l) => (
                  <button
                    key={l.level}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer text-left ${
                      activeLevel === l.level ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}
                    onClick={() => setActiveLevel(l.level)}
                  >
                    <motion.div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: activeLevel === l.level ? `${l.color}25` : 'rgba(255,255,255,0.03)',
                        color: activeLevel === l.level ? l.color : 'rgba(255,255,255,0.2)',
                      }}
                      animate={activeLevel === l.level ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {l.level}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${activeLevel === l.level ? 'text-white' : 'text-white/30'}`}>
                          {l.label}
                        </span>
                        <span className="text-[11px] text-white/15">top {100 - l.pct}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: l.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${l.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + l.level * 0.08, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — Copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-xs font-medium text-[#7A8EC0] uppercase tracking-[0.2em] mb-4">Verification</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
              Your level is
              <br />
              <span className="bg-gradient-to-r from-[#7A8EC0] to-[#8B5CF6] bg-clip-text text-transparent">earned.</span>
            </h2>
            <p className="text-base text-white/30 leading-relaxed mb-8 max-w-[400px]">
              AI analyses your work across GitHub, LeetCode, Kaggle, and 3 more platforms.
              No surveys. No self-assessment.
            </p>

            <div className="flex flex-wrap gap-2">
              {['GitHub', 'LeetCode', 'Kaggle', 'Stack Overflow', 'Codeforces'].map((p) => (
                <span key={p} className="text-xs text-white/25 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.04]">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
