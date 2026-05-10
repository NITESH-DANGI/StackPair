'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import NumberTicker from '@/components/magicui/NumberTicker';

export default function FoundingMentorBanner() {
  return (
    <section id="founding-mentor" className="relative py-32 sm:py-40 border-t border-white/[0.04]">
      <div className="max-w-[900px] mx-auto px-6 md:px-12 xl:px-0 text-center relative z-10">
        {/* Badge */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 bg-[#F59E0B]/[0.08] text-[#F59E0B] text-xs font-semibold px-4 py-1.5 rounded-full border border-[#F59E0B]/10">
            <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse-dot" />
            Limited Programme
          </span>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          100 Founding Mentors.
          <br />
          <span className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">
            <NumberTicker value={67} duration={2} /> spots left.
          </span>
        </motion.h2>

        <motion.p
          className="text-base text-white/30 max-w-[460px] mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Complete 5 sessions — earn a permanent Founding Mentor badge,
          200 bonus Bridge Points, and early access to everything.
        </motion.p>

        {/* Progress bar */}
        <motion.div
          className="max-w-[400px] mx-auto mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between text-[11px] text-white/20 mb-2">
            <span>33 claimed</span>
            <span>100 total</span>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
              initial={{ width: 0 }}
              whileInView={{ width: '33%' }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
              style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/signup?referral=founding_mentor"
            className="group inline-flex items-center gap-2 rounded-full font-semibold text-[15px] px-8 py-3.5 bg-[#F59E0B] text-[#09090B] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-[1.02]"
          >
            Claim Your Badge
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
