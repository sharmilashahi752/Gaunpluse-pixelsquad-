import React from 'react';

/**
 * Reusable Badge component using GaunPulse design tokens
 */
export function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClasses = {
    neutral: 'bg-[#DDEBE2] text-[#173D32] border border-[#42866A]/20',
    forest: 'bg-[#173D32] text-white',
    amber: 'bg-[#E3AD58]/20 text-[#8F5E16] border border-[#E3AD58]/40',
    alert: 'bg-[#D45F53]/15 text-[#D45F53] border border-[#D45F53]/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
