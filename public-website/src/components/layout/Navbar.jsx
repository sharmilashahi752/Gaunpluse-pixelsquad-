import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Activity } from 'lucide-react';
import Container from '../ui/Container';
import { NAV_LINKS } from '../../data/routes';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const menuButtonRef = useRef(null);

  // Close mobile drawer when location pathname changes (derived state during render)
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

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F8F7F2]/90 backdrop-blur-md border-b border-[#42866A]/20 transition-all duration-200">
      <Container>
        <div className="flex items-center justify-between h-18">
          {/* Brand Identity / Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-3 group rounded-lg focus-visible:ring-2 focus-visible:ring-[#173D32] focus-visible:ring-offset-2 focus:outline-hidden py-1"
            aria-label="GaunPulse — Return to homepage"
          >
            {/* Logo Mark: Pulse & Mountain Peak hybrid */}
            <div className="w-10 h-10 rounded-xl bg-[#173D32] flex items-center justify-center text-white shadow-xs group-hover:bg-[#122F26] transition-colors border border-[#42866A]/30">
              <Activity className="w-5 h-5 text-[#E3AD58] transition-transform group-hover:scale-110" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#173D32]">
                  Gaun<span className="text-[#42866A]">Pulse</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-[#42866A]/75 tracking-tight">
                  गाउँ पल्स
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-wide text-[#42866A] -mt-0.5">
                The Village That Speaks
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#173D32] focus-visible:ring-offset-1 focus:outline-hidden ${
                    isActive
                      ? 'text-[#173D32] bg-[#DDEBE2] shadow-2xs font-bold'
                      : 'text-[#1B2923]/80 hover:text-[#173D32] hover:bg-[#DDEBE2]/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action: Primary CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#173D32] text-white hover:bg-[#122F26] shadow-xs hover:shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#173D32] focus-visible:ring-offset-2 focus:outline-hidden group"
            >
              <span>Explore Demo</span>
              <ArrowUpRight className="w-4 h-4 text-[#E3AD58] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-lg text-[#173D32] hover:bg-[#DDEBE2] focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden transition-colors"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation Drawer / Panel */}
      {isOpen && (
        <div
          id="mobile-navigation-menu"
          role="region"
          aria-label="Mobile Navigation Drawer"
          className="md:hidden fixed inset-x-0 top-18 bottom-0 bg-[#F8F7F2]/95 backdrop-blur-lg border-t border-[#42866A]/20 z-50 overflow-y-auto px-4 py-6 flex flex-col justify-between animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-4">
            <div className="px-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#42866A]">
                Navigation
              </p>
            </div>
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-base font-semibold flex items-center justify-between transition-colors focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
                      isActive
                        ? 'bg-[#173D32] text-white shadow-xs'
                        : 'text-[#1B2923] hover:bg-[#DDEBE2]'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-70" />
                </NavLink>
              ))}
            </nav>

            {/* Preserved Route Link: Public Notices */}
            <div className="pt-2 px-1 border-t border-[#42866A]/15">
              <Link
                to="/notices"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#42866A] hover:text-[#173D32] flex items-center justify-between rounded-lg"
              >
                <span>Municipal Public Notices</span>
                <span className="text-xs bg-[#DDEBE2] px-2 py-0.5 rounded text-[#173D32]">Updates</span>
              </Link>
            </div>
          </div>

          {/* Mobile Bottom CTA */}
          <div className="pt-6 border-t border-[#42866A]/15 space-y-3">
            <Link
              to="/demo"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-base font-semibold bg-[#173D32] text-white hover:bg-[#122F26] shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden"
            >
              <span>Explore Interactive Demo</span>
              <ArrowUpRight className="w-5 h-5 text-[#E3AD58]" />
            </Link>
            <p className="text-center text-xs text-[#42866A] font-medium">
              CivicTech Intelligence for Rural Nepal
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
