'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizes = {
  sm: { img: 40, text: 'text-lg' },
  md: { img: 48, text: 'text-xl' },
  lg: { img: 56, text: 'text-2xl' },
};

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="StackPair"
        width={s.img}
        height={s.img}
        className="object-contain"
        priority
      />
      {showText && (
        <span className={`font-semibold text-[#1A1A1A] ${s.text}`}>StackPair</span>
      )}
    </div>
  );
}
