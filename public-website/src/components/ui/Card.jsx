import React from 'react';

/**
 * Reusable Card component for warm, structured content surfaces
 */
export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-xs rounded-xl border border-[#42866A]/15 p-6 shadow-xs ${
        hover ? 'transition-all duration-200 hover:shadow-md hover:border-[#42866A]/30' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
