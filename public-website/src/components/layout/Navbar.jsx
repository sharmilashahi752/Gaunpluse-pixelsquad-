import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Container from '../ui/Container';
import BrandLogo from './BrandLogo';

/**
 * Clean Minimalist Editorial Navigation Bar (Inspired by Frame Studio)
 * Features:
 * - Restored original GaunPulse pulse-style logo icon next to GAUNPULSE wordmark on one horizontal line
 * - Left-aligned brand identity, right-aligned navigation groups
 * - Two balanced navigation groups toward the right:
 *     Group 1: HOME, ABOUT, INSIGHTS
 *     Group 2: ISSUES, EXPLORE MAP, LIVE DEMO, SIGN IN
 * - Small uppercase typography (~12-13px, weight 600, letter spacing 0.06em)
 * - Minimal active underline indicator
 * - Pure white background, thin bottom border, zero heavy shadows or pill shapes
 * - Responsive mobile menu drawer with complete keyboard accessibility
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const menuButtonRef = useRef(null);

  // Close mobile drawer when location pathname changes
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsOpen(false);
  }

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (menuButtonRef.current) {
          menuButtonRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Navigation links for desktop and mobile navigation
  const allNavLinks = [
    { label: 'HOME', path: '/' },
    { label: 'ABOUT', path: '/about' },
    { label: 'INSIGHTS', path: '/insights' },
    { label: 'ISSUES', path: '/issues' },
    { label: 'EXPLORE MAP', path: '/map' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-stone-200/80 transition-all">
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* 1. Left: GaunPulse Brand Identity (Logo + Two-line Text matching footer) */}
          <BrandLogo variant="navbar" />

          {/* 2. Right: Desktop Navigation Links (All 7 links in one row with 24-28px gap) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-5 xl:gap-[26px]"
          >
            {allNavLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `text-[12px] font-medium sm:font-semibold uppercase tracking-[0.05em] leading-[1.4] pt-2 pb-2 border-b transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#111111] focus-visible:outline-offset-2 ${
                    isActive
                      ? 'border-[#111111] text-[#111111]'
                      : 'border-transparent text-[#111111]/75 hover:text-[#111111] hover:border-[#111111]/30'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* SIGN IN Action */}
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `text-[12px] font-medium sm:font-semibold uppercase tracking-[0.05em] leading-[1.4] pt-2 pb-2 border-b transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#111111] focus-visible:outline-offset-2 ${
                  isActive
                    ? 'border-[#111111] text-[#111111]'
                    : 'border-transparent text-[#111111]/75 hover:text-[#111111] hover:border-[#111111]/30'
                }`
              }
            >
              SIGN IN
            </NavLink>
          </nav>

          {/* 3. Mobile Hamburger Toggle (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -mr-2 text-[#111111] hover:bg-stone-100 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#111111]"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {/* 4. Mobile Navigation Drawer */}
      {isOpen && (
        <div
          id="mobile-navigation-menu"
          role="region"
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden fixed inset-x-0 top-20 bottom-0 bg-white z-50 overflow-y-auto px-6 py-8 flex flex-col justify-between border-t border-stone-200 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-400 block pb-2 border-b border-stone-100">
              Menu
            </span>

            <nav className="flex flex-col space-y-2">
              {allNavLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center text-sm font-semibold uppercase tracking-[0.06em] px-2 transition-colors ${
                      isActive ? 'text-[#111111] font-bold' : 'text-stone-600 hover:text-[#111111]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Mobile Drawer Footer Actions */}
          <div className="pt-6 border-t border-stone-100 space-y-3">
            <NavLink
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center py-3 px-4 text-xs font-semibold uppercase tracking-[0.06em] bg-[#111111] text-white rounded-lg hover:bg-black transition-colors"
            >
              SIGN IN
            </NavLink>
            <p className="text-center text-[11px] text-stone-400">
              CivicTech Prototype for Rural Nepal
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
