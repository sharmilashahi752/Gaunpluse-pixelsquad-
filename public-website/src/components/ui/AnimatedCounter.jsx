import React, { useEffect, useState, useRef } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

/**
 * Animated number counter component
 * Smoothly animates numbers from 0 to target value once when entering viewport.
 * Fully handles formatted number strings (e.g. "1,040") and respects prefers-reduced-motion.
 */
export function AnimatedCounter({ value, duration = 1.1, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  const numericValue =
    typeof value === 'number'
      ? value
      : parseInt(String(value).replace(/,/g, ''), 10);
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    if (shouldReduceMotion || !isInView || !isNumeric) return;

    let start = 0;
    const end = numericValue;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(
        typeof value === 'string' && value.includes(',')
          ? current.toLocaleString()
          : current
      );

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isInView, numericValue, isNumeric, duration, shouldReduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      {shouldReduceMotion ? value : displayValue}
    </span>
  );
}

export default AnimatedCounter;
