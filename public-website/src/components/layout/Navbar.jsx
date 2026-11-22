import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Container from '../ui/Container';
import BrandLogo from './BrandLogo';

/**
 * Clean Minimalist Editorial Navigation Bar (Inspired by Frame Studio)
 * Features:
 * - Animated underline hover and active transitions
 * - Logo scale micro-interaction
 * - Subtle background and shadow transition when sticky header is scrolled
 * - Smooth mobile drawer opening & closing with AnimatePresence
 * - Keyboard accessible with Escape key and focus management
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const menuButtonRef = useRef(null);

  // Close mobile drawer when location pathname changes
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsOpen(false);
  }

  // Handle subtle sticky header state change on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ease-out ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-stone-200'
          : 'bg-white border-b border-stone-200/80'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* 1. Left: GaunPulse Brand Identity */}
          <BrandLogo variant="navbar" />

          {/* 2. Right: Desktop Navigation Links with animated underline */}
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
                  `relative text-[12px] font-medium sm:font-semibold uppercase tracking-[0.05em] leading-[1.4] py-2 transition-colors duration-200 group focus-visible:outline-2 focus-visible:outline-[#111111] focus-visible:outline-offset-2 ${
                    isActive
                      ? 'text-[#111111]'
                      : 'text-[#111111]/75 hover:text-[#111111]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.label}</span>
                    {/* Animated Underline */}
                    <span
                      className={`absolute bottom-0 inset-x-0 h-[2px] bg-[#111111] transition-all duration-200 ease-out origin-left ${
                        isActive
                          ? 'opacity-100 scale-x-100'
                          : 'opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}

            {/* SIGN IN Action */}
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `relative text-[12px] font-medium sm:font-semibold uppercase tracking-[0.05em] leading-[1.4] py-2 transition-colors duration-200 group focus-visible:outline-2 focus-visible:outline-[#111111] focus-visible:outline-offset-2 ${
                  isActive
                    ? 'text-[#111111]'
                    : 'text-[#111111]/75 hover:text-[#111111]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>SIGN IN</span>
                  <span
                    className={`absolute bottom-0 inset-x-0 h-[2px] bg-[#111111] transition-all duration-200 ease-out origin-left ${
                      isActive
                        ? 'opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-100'
                    }`}
                  />
                </>
              )}
            </NavLink>
          </nav>

          {/* 3. Mobile Hamburger Toggle (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -mr-2 text-[#111111] hover:bg-stone-100 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#111111] cursor-pointer"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {/* 4. Mobile Navigation Drawer with AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation-menu"
            role="region"
            aria-label="Mobile Navigation Drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="lg:hidden fixed inset-x-0 top-20 bottom-0 bg-white z-50 overflow-y-auto px-6 py-8 flex flex-col justify-between border-t border-stone-200"
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
