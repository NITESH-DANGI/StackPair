'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

interface NumberTickerProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
}

export default function NumberTicker({
  value,
  suffix = '',
  prefix = '',
  className = '',
  decimals = 0,
  duration = 1.5,
  delay = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasStarted, setHasStarted] = useState(false);

  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });

  const displayValue = useTransform(springValue, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.floor(latest).toLocaleString();
  });

  useEffect(() => {
    if (isInView && !hasStarted) {
      const timeout = setTimeout(() => {
        springValue.set(value);
        setHasStarted(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, springValue, delay, hasStarted]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
