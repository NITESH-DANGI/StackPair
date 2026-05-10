'use client';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  duration?: number;
  pauseOnHover?: boolean;
}

export default function Marquee({
  children,
  className = '',
  reverse = false,
  duration = 30,
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
    >
      <div
        className={`flex w-max gap-6 ${
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        } ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
      >
        {/* Duplicate children for seamless loop */}
        {children}
        {children}
      </div>
    </div>
  );
}
