import React from 'react';
import gaunpulseLogo from '../assets/gaunpulse-logo.png';

/**
 * Reusable GaunPulseLogo Component
 *
 * Provides official branding for the GaunPulse platform matching the public website design system.
 *
 * Layout:
 * [Logo Emblem (approx 48-52px)]
 *   Line 1: GaunPulse (extrabold) + गाउँपल्स (semibold Nepali script)
 *   Line 2: The Village That Speaks (muted tagline)
 *
 * Variants:
 * - 'sidebar' | 'dark': Crisp white and soft-green typography on dark-green backgrounds
 * - 'light' | 'navbar': Dark forest-green typography on light backgrounds
 *
 * Props:
 * - variant: 'sidebar' | 'light' (default: 'sidebar')
 * - size: number (default: 50)
 * - collapsed: boolean (default: false - if true, shows only centered logo icon)
 * - showTagline: boolean (default: true)
 * - showNepali: boolean (default: true)
 * - className: string
 * - onClick: function
 */
export default function GaunPulseLogo({
  variant = 'sidebar',
  size = 50,
  collapsed = false,
  showTagline = true,
  showNepali = true,
  className = '',
  onClick,
}) {
  const isDark = variant === 'sidebar' || variant === 'dark';

  return (
    <div
      className={`gaunpulse-brand ${isDark ? 'gaunpulse-brand--dark' : 'gaunpulse-brand--light'} ${
        collapsed ? 'gaunpulse-brand--collapsed' : ''
      } ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: collapsed ? '0' : '12px',
        textDecoration: 'none',
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: 0,
      }}
    >
      {/* Official Transparent GaunPulse Emblem */}
      <img
        src={gaunpulseLogo}
        alt="GaunPulse official emblem"
        className="gaunpulse-brand__logo-img"
        style={{
          height: `${size}px`,
          width: 'auto',
          maxWidth: `${Math.round(size * 1.15)}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
        loading="eager"
      />

      {/* Brand Text Hierarchy */}
      {!collapsed && (
        <div
          className="gaunpulse-brand__copy"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            textAlign: 'left',
          }}
        >
          {/* Line 1: Bilingual Brand Name (GaunPulse गाउँपल्स) */}
          <div
            className="gaunpulse-brand__heading"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              className="gaunpulse-brand__title"
              style={{
                fontSize: size >= 48 ? '21px' : '18px',
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: isDark ? '#ffffff' : '#173D32',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              Gaun<span style={{ color: isDark ? '#DDEBE2' : '#3d8b67' }}>Pulse</span>
            </span>
            {showNepali && (
              <span
                className="gaunpulse-brand__nepali"
                style={{
                  fontSize: size >= 48 ? '13px' : '11.5px',
                  fontWeight: 600,
                  color: isDark ? 'rgba(221, 235, 226, 0.85)' : '#356D57',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: '0.2px',
                }}
              >
                गाउँपल्स
              </span>
            )}
          </div>

          {/* Line 2: Tagline */}
          {showTagline && (
            <span
              className="gaunpulse-brand__tagline"
              style={{
                fontSize: size >= 48 ? '11px' : '10px',
                fontWeight: 500,
                color: isDark ? '#93C5AA' : '#476359',
                marginTop: '3px',
                letterSpacing: '0.2px',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
              }}
            >
              The Village That Speaks
            </span>
          )}
        </div>
      )}
    </div>
  );
}
