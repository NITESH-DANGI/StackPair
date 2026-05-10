'use client';

import { useRef, useState } from 'react';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltIntensity?: number;
}

export default function InteractiveCard({
  children,
  className = '',
  glowColor = 'rgba(122, 142, 192, 0.15)',
  tiltIntensity = 10,
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    transition: 'transform 0.3s ease-out',
  });
  const [glareStyle, setGlareStyle] = useState({
    background: 'transparent',
    opacity: 0,
  });
  const [glowStyle, setGlowStyle] = useState({
    background: 'transparent',
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
    const rotateY = ((x - centerX) / centerX) * tiltIntensity;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    });

    // Glare effect
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlareStyle({
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
      opacity: 1,
    });

    // Glow border effect
    setGlowStyle({
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, ${glowColor} 0%, transparent 60%)`,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out',
    });
    setGlareStyle({ background: 'transparent', opacity: 0 });
    setGlowStyle({ background: 'transparent', opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow border */}
      <div
        className="absolute -inset-px rounded-[inherit] pointer-events-none transition-opacity duration-500"
        style={glowStyle}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Glare overlay */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
        style={glareStyle}
      />
    </div>
  );
}
