import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Button component with accessible styles, active feedback, and variants
 */
export function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  onClick,
  disabled = false,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-[#123D30] hover:bg-[#236A50] text-[#FFFFFF] focus:ring-[#123D30]',
    secondary: 'bg-[#FFFFFF] border border-[#123D30] text-[#123D30] hover:bg-[#E7F3ED] focus:ring-[#123D30]',
    outline: 'border border-[#123D30] text-[#123D30] hover:bg-[#E7F3ED] focus:ring-[#123D30]',
    ghost: 'text-[#1B2923] hover:bg-[#E7F3ED] focus:ring-[#123D30]',
  };

  const classes = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export default Button;
