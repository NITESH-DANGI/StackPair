'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Particles from '@/components/magicui/Particles';

export default function FinalCTA() {
  return (
    <section className="relative py-32 sm:py-40 overflow-hidden border-t border-white/[0.04]">
      <div className="absolute inset-0 hero-gradient" />
      <Particles quantity={20} color="122, 142, 192" size={1.2} speed={0.1} mouseInfluence={60} />

      <div className="max-w-[700px] mx-auto px-6 text-center relative z-10">
        <motion.h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ready to start?
        </motion.h2>

        <motion.p
          className="text-base text-white/30 mb-10 max-w-[400px] mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          Join developers who build real things and get discovered.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full font-semibold text-[15px] px-8 py-3.5 bg-white text-[#09090B] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-[1.02]"
          >
            Get Started Free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        <motion.p
          className="text-xs text-white/15 mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Free forever tier · No credit card · Delete anytime
        </motion.p>
      </div>
    </section>
  );
}
