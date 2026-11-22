import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Reusable ScrollReveal component
 * Subtle, GPU-friendly entrance animation triggered once when entering viewport.
 * - Initial: opacity 0, translateY 16px
 * - Final: opacity 1, translateY 0
 * - Duration: 500ms
 * - Fully respects prefers-reduced-motion
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 16,
  duration = 0.5,
  once = true,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
