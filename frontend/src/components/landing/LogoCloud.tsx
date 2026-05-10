'use client';

import { motion } from 'framer-motion';
import Marquee from '@/components/magicui/Marquee';

/* Fake platform logos as styled text — in production you'd use SVGs */
const logos = [
  { name: 'Razorpay', color: '#528FF0' },
  { name: 'Swiggy', color: '#FC8019' },
  { name: 'Flipkart', color: '#F8E471' },
  { name: 'Zerodha', color: '#387ED1' },
  { name: 'CRED', color: '#FFFFFF' },
  { name: 'PhonePe', color: '#5F259F' },
  { name: 'Meesho', color: '#FF6A88' },
  { name: 'Dream11', color: '#CC0000' },
];

export default function LogoCloud() {
  return (
    <section className="relative py-16 border-y border-white/[0.04]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.p
          className="text-center text-xs text-white/20 uppercase tracking-[0.2em] mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Developers from leading companies
        </motion.p>
      </div>

      <Marquee duration={25} pauseOnHover>
        {logos.map((logo) => (
          <div
            key={logo.name}
            className="flex items-center justify-center px-10 opacity-30 hover:opacity-60 transition-opacity duration-300"
          >
            <span className="text-lg font-semibold tracking-tight" style={{ color: logo.color }}>
              {logo.name}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}
