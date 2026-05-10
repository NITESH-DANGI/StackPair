'use client';

import { motion, type Variants } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
  staggerChildren?: number;
  once?: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: {
      staggerChildren: stagger,
    },
  }),
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

export default function AnimatedText({
  text,
  className = '',
  as: Tag = 'h2',
  delay = 0,
  staggerChildren = 0.06,
  once = true,
}: AnimatedTextProps) {
  const words = text.split(' ');

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-50px' }}
        custom={staggerChildren}
        transition={{ delayChildren: delay }}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            variants={wordVariants}
          >
            {word}
            {i < words.length - 1 && '\u00A0'}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
