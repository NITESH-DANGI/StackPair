'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Connect',
    desc: 'Link GitHub, LeetCode & Kaggle. AI verifies your skill level.',
    color: '#7A8EC0',
  },
  {
    num: '02',
    title: 'Match',
    desc: 'Swipe through developers at your level. Book a 30-min session.',
    color: '#22C55E',
  },
  {
    num: '03',
    title: 'Build',
    desc: 'Ship real projects together. Get discovered by startups.',
    color: '#8B5CF6',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 sm:py-40">
      <div className="absolute inset-0 section-glow" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            className="text-xs font-medium text-[#7A8EC0] uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.p>
          <motion.h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Three steps.
            <br />
            <span className="text-white/30">Zero friction.</span>
          </motion.h2>
        </div>

        {/* Steps — big numbered cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="bento-card p-8 sm:p-10 h-full relative overflow-hidden">
                {/* Big number */}
                <span
                  className="absolute -top-4 -right-2 text-[120px] font-black leading-none select-none pointer-events-none"
                  style={{ color: `${step.color}08` }}
                >
                  {step.num}
                </span>

                {/* Colored line */}
                <div className="w-8 h-1 rounded-full mb-8" style={{ backgroundColor: step.color }} />

                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-white/35 text-[15px] leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
