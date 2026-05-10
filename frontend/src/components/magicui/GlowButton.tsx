'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'accent' | 'white';
}

export default function GlowButton({
  href,
  children,
  className = '',
  variant = 'accent',
}: GlowButtonProps) {
  const variants = {
    accent: {
      bg: 'bg-[#7A8EC0]',
      text: 'text-white',
      glow: 'shadow-[0_0_24px_rgba(122,142,192,0.35),0_0_60px_rgba(122,142,192,0.15)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(122,142,192,0.5),0_0_80px_rgba(122,142,192,0.25)]',
    },
    white: {
      bg: 'bg-white',
      text: 'text-[#34343C]',
      glow: 'shadow-[0_0_24px_rgba(255,255,255,0.2),0_0_60px_rgba(255,255,255,0.1)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.3),0_0_80px_rgba(255,255,255,0.15)]',
    },
  };

  const v = variants[variant];

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Link
        href={href}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] px-8 py-3.5 cursor-pointer transition-all duration-300 ${v.bg} ${v.text} ${v.glow} ${v.hoverGlow} ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}
