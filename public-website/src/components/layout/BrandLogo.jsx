import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable BrandLogo Component for GaunPulse
 *
 * Supports two colorway variants:
 * - 'navbar': Dark forest-green text on pure white background
 * - 'footer': Crisp white and muted light-green text on dark forest-green background
 *
 * Structure:
 * [Logo Image (44-48px in navbar, 52-56px in footer)]
 *   Line 1: GaunPulse (extrabold) + गाउँ पल्स (semibold Nepali script)
 *   Line 2: The Village That Speaks (medium tagline)
 */
export function BrandLogo({ variant = 'navbar', className = '' }) {
  const isFooter = variant === 'footer';

  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none shrink-0 ${isFooter
          ? 'focus-visible:ring-2 focus-visible:ring-[#E3AD58] focus-visible:outline-hidden rounded-lg'
          : 'focus-visible:outline-2 focus-visible:outline-[#173D32] focus-visible:outline-offset-2 py-1'
        } ${className}`}
      aria-label="GaunPulse — Return to homepage"
    >
      {/* Approved GaunPulse Logo */}
      <img
        src="/images/gaunpulse-logo.png"
        alt="GaunPulse Logo"
        className={`${isFooter
            ? 'w-[52px] h-[52px] sm:w-[56px] sm:h-[56px]'
            : 'w-[44px] h-[44px] sm:w-[46px] sm:h-[46px]'
          } object-contain shrink-0 transition-transform duration-200 ease-out group-hover:scale-[1.03] active:scale-[0.98]`}
      />

      {/* Two-line Brand Text: Exact Footer Hierarchy & Typography */}
      <div className="flex flex-col text-left">
        {/* Line 1: GaunPulse + Nepali Devanagari script */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={`${isFooter ? 'text-xl font-extrabold text-white' : 'text-[18px] sm:text-[19px] font-extrabold text-[#173D32]'
              } tracking-tight leading-tight`}
          >
            Gaun
            <span className={isFooter ? 'text-[#DDEBE2]' : 'text-[#42866A]'}>
              Pulse
            </span>
          </span>
          <span
            className={`text-[11px] font-semibold tracking-tight ${isFooter ? 'text-[#DDEBE2]/75' : 'text-[#356D57]'
              }`}
          >
            गाउँ पल्स
          </span>
        </div>

        {/* Line 2: Tagline directly beneath the brand name */}
        <span
          className={`text-[11px] font-medium tracking-wide ${isFooter ? 'text-[#B8D0C4] -mt-0.5' : 'text-[#476359] mt-0.5'
            } leading-tight`}
        >
          The Village That Speaks
        </span>
      </div>
    </Link>
  );
}

export default BrandLogo;
