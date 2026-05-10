'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CTAButtonProps {
  href: string;
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function CTAButton({ href, variant = 'primary', children, className = '', onClick }: CTAButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] transition-all duration-200 px-8 py-3.5 cursor-pointer';

  const variants = {
    primary: 'bg-[#7A8EC0] text-white hover:bg-[#6A7EB0] shadow-[0_2px_12px_rgba(122,142,192,0.3)]',
    ghost: 'bg-transparent border border-[#E5E5E3] text-[#4B5563] hover:border-[#7A8EC0] hover:text-[#7A8EC0]',
  };

  return (
    <motion.div
      className="inline-flex"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        className={`${base} ${variants[variant]} ${className}`}
        onClick={onClick}
      >
        {children}
      </Link>
    </motion.div>
  );
}
