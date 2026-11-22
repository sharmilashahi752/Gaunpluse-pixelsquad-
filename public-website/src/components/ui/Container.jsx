import React from 'react';

/**
 * Responsive container wrapper for consistent horizontal alignment
 */
export function Container({ children, className = '', size = 'default' }) {
  const sizeClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    wide: 'max-w-full',
  };

  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size] || sizeClasses.default} ${className}`}>
      {children}
    </div>
  );
}

export default Container;
