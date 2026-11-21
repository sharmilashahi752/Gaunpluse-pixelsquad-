import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ExternalLink,
} from 'lucide-react';
import Container from '../ui/Container';

const CURRENT_YEAR = 2026;

function GithubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

/**
 * Reusable professional footer for GaunPulse public website
 */
export function Footer() {
  const mainNavLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore Map', path: '/map' },
    { label: 'Live Demo', path: '/demo' },
    { label: 'Community Issues', path: '/issues' },
    { label: 'Public Notices', path: '/notices' },
    { label: 'Insights & Data', path: '/insights' },
    { label: 'About GaunPulse', path: '/about' },
  ];

  const policyLinks = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Use', path: '/terms' },
  ];

  return (
    <footer className="border-t border-[#42866A]/20 bg-[#F8F7F2] text-[#1B2923] text-sm mt-auto">
      {/* Upper Footer: Brand, Navigation & GitHub Links */}
      <div className="py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Col 1: Brand & Project Mission (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <Link
                to="/"
                className="inline-flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-[#173D32] rounded-lg"
                aria-label="GaunPulse — Return to homepage"
              >
                <div className="w-10 h-10 rounded-xl bg-[#173D32] flex items-center justify-center text-white shadow-xs group-hover:bg-[#122F26] transition-colors border border-[#42866A]/30">
                  <Activity className="w-5 h-5 text-[#E3AD58]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold tracking-tight text-[#173D32]">
                      Gaun<span className="text-[#42866A]">Pulse</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#42866A]/75 tracking-tight">
                      गाउँ पल्स
                    </span>
                  </div>
                  <span className="text-[11px] font-medium tracking-wide text-[#42866A] -mt-0.5">
                    The Village That Speaks
                  </span>
                </div>
              </Link>

              <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed max-w-sm">
                An AI-assisted rural infrastructure intelligence and decision-support platform designed to help Nepalese communities and local governments understand damaged assets and prioritize repair actions.
              </p>

              {/* GitHub Repository Reference */}
              <div className="pt-2">
                <a
                  href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#42866A]/25 text-xs font-semibold text-[#173D32] hover:bg-[#DDEBE2] hover:border-[#42866A]/40 shadow-2xs transition-all"
                >
                  <GithubIcon className="w-4 h-4 text-[#173D32]" />
                  <span>Team GitHub Repository (PixelSquad)</span>
                  <ExternalLink className="w-3 h-3 text-[#42866A]" />
                </a>
              </div>
            </div>

            {/* Col 2: Quick Platform Navigation (4 cols) */}
            <div className="md:col-span-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#173D32]">
                Platform Modules
              </h3>
              <ul className="grid grid-cols-2 gap-2 text-xs">
                {mainNavLinks.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-[#1B2923]/75 hover:text-[#173D32] hover:underline transition-colors block py-1 font-medium focus-visible:ring-2 focus-visible:ring-[#173D32] rounded-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Civic prototype context & Policies (3 cols) */}
            <div className="md:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#173D32]">
                Civic Context & Terms
              </h3>
              <ul className="space-y-1.5 text-xs">
                {policyLinks.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-[#1B2923]/75 hover:text-[#173D32] hover:underline transition-colors block py-1 font-medium focus-visible:ring-2 focus-visible:ring-[#173D32] rounded-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="p-3 rounded-xl bg-[#DDEBE2]/60 border border-[#42866A]/20 text-[11px] text-[#1B2923]/75 leading-relaxed">
                <p className="font-semibold text-[#173D32] mb-0.5">Prototype Status</p>
                Demonstrated using synthetic Sundar Gaun topology for the Nepalese CivicTech showcase.
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar: Legal Disclaimer & Copyright */}
      <div className="border-t border-[#42866A]/15 bg-[#DDEBE2]/30 py-5">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#1B2923]/70">
            <div>
              <p>
                © {CURRENT_YEAR} PixelSquad. Developed as an open-source CivicTech prototype for Nepal.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-[#42866A] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42866A]" />
                Fictional Demonstration Data
              </span>
              <span>•</span>
              <span>Not Official Municipal Government Services</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default Footer;
