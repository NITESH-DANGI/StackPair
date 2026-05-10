'use client';

import { motion } from 'framer-motion';
import Marquee from '@/components/magicui/Marquee';

const testimonials = [
  { name: 'Arjun K.', role: 'SDE-2, Razorpay', initials: 'AK', quote: 'The level matching actually works. My session partners are exactly the right level.', color: '#7A8EC0' },
  { name: 'Priya M.', role: 'NIT Trichy', initials: 'PM', quote: 'AI-verified levels felt accurate. Not too easy, not overwhelming.', color: '#22C55E' },
  { name: 'Rahul S.', role: 'Founding Mentor', initials: 'RS', quote: 'Earned 600 Bridge Points in the first month. The flywheel is real.', color: '#8B5CF6' },
  { name: 'Sneha D.', role: 'ML Eng, Flipkart', initials: 'SD', quote: 'It pulled my Kaggle competition rankings. Finally sees ML engineers for real work.', color: '#F59E0B' },
  { name: 'Vikram P.', role: 'SDE-1, Swiggy', initials: 'VP', quote: 'Found a co-builder. Shipped a project in 2 weeks. Startups reach out weekly.', color: '#06B6D4' },
  { name: 'Ananya R.', role: 'BITS Pilani', initials: 'AR', quote: 'Session notes AI generates are like having a free tutor after every call.', color: '#EC4899' },
];

const firstRow = testimonials.slice(0, 3);
const secondRow = testimonials.slice(3);

function TestimonialCard({ name, role, initials, quote, color }: typeof testimonials[0]) {
  return (
    <div className="w-[340px] sm:w-[380px] shrink-0 bento-card p-6 rounded-2xl mx-3 hover:bg-white/[0.05] transition-all duration-300">
      <p className="text-sm text-white/40 leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${color}15`, color }}>
          {initials}
        </div>
        <div>
          <p className="text-sm text-white/70 font-medium">{name}</p>
          <p className="text-[11px] text-white/20">{role}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialSlider() {
  return (
    <section className="relative py-32 sm:py-40 border-t border-white/[0.04] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 xl:px-0">
        <div className="text-center mb-16">
          <motion.p
            className="text-xs font-medium text-[#7A8EC0] uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Testimonials
          </motion.p>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Loved by
            <span className="text-white/30"> developers.</span>
          </motion.h2>
        </div>
      </div>

      <div className="space-y-4">
        <Marquee duration={35} pauseOnHover>
          {firstRow.map((t) => <TestimonialCard key={t.name} {...t} />)}
        </Marquee>
        <Marquee duration={40} pauseOnHover reverse>
          {secondRow.map((t) => <TestimonialCard key={t.name} {...t} />)}
        </Marquee>
      </div>
    </section>
  );
}
