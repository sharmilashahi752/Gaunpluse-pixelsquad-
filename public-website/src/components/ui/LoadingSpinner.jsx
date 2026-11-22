import React from 'react';
import Container from './Container';

/**
 * Accessible page loading fallback for React.lazy route code-splitting
 */
export function LoadingSpinner({ message = 'Loading GaunPulse module...' }) {
  return (
    <Container className="py-24 sm:py-32 flex flex-col items-center justify-center text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-3 border-[#DDEBE2]" />
        <div className="absolute inset-0 rounded-full border-3 border-[#173D32] border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-semibold text-[#173D32]">{message}</p>
      <p className="text-xs text-[#42866A] mt-1">The Village That Speaks — CivicTech Demo</p>
    </Container>
  );
}

export default LoadingSpinner;
