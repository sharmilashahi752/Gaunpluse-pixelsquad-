import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
} from 'lucide-react';
import Container from '../ui/Container';
import BrandLogo from './BrandLogo';

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
 * Editorial Dark Forest-Green Footer for GaunPulse
 * Palette:
 * - Main container: #173D32 (Dark Forest Green)
 * - Bottom copyright strip: #123126 (Darker Forest Green)
 * - Primary text: #FFFFFF
 * - Secondary text: #DDEBE2
 * - Muted text: #B8D0C4
 * - Dividers: rgba(255, 255, 255, 0.15)
 * - Hover accents: #E3AD58
 */
export function Footer() {
  const platformModuleLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore Map', path: '/map' },
    { label: 'Live Demo', path: '/demo' },
    { label: 'Community Issues', path: '/issues' },
    { label: 'Public Notices', path: '/notices' },
    { label: 'Insights & Data', path: '/insights' },
    { label: 'About GaunPulse', path: '/about' },
  ];

  const civicPolicyLinks = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Use', path: '/terms' },
  ];

  return (
    <footer className="bg-[#173D32] text-white border-t border-white/15 text-sm mt-auto">
      {/* Upper Footer: 3-Column Clean Editorial Grid */}
      <div className="py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Col 1: Brand, Mission & GitHub (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4">
              <BrandLogo variant="footer" />

              <p className="text-xs sm:text-sm text-[#DDEBE2] leading-relaxed max-w-sm">
                An AI-assisted rural infrastructure intelligence and decision-support platform designed to help Nepalese communities and local governments understand damaged assets and prioritize repair actions.
              </p>

              {/* GitHub Repository Reference */}
              <div className="pt-1">
                <a
                  href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-white hover:text-[#E3AD58] hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-[#E3AD58] focus-visible:outline-hidden rounded-xs"
                >
                  <GithubIcon className="w-4 h-4 shrink-0 text-white" />
                  <span>Team GitHub Repository (PixelSquad)</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#B8D0C4]" />
                </a>
              </div>
            </div>

            {/* Col 2: Platform Modules Navigation (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Platform Modules
              </h3>
              <ul className="grid grid-cols-2 gap-2 text-xs">
                {platformModuleLinks.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-[#DDEBE2] hover:text-[#E3AD58] hover:underline transition-colors block py-1 font-medium focus-visible:ring-2 focus-visible:ring-[#E3AD58] focus-visible:outline-hidden rounded-xs"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Civic Context & Terms (3 cols on lg) */}
            <div className="md:col-span-2 lg:col-span-3 space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Civic Context & Terms
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {civicPolicyLinks.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className="text-[#DDEBE2] hover:text-[#E3AD58] hover:underline transition-colors block py-1 font-medium focus-visible:ring-2 focus-visible:ring-[#E3AD58] focus-visible:outline-hidden rounded-xs"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prototype Status */}
              <div className="pt-1.5 space-y-1 text-left">
                <p className="text-[14px] font-semibold text-white">Prototype Status</p>
                <p className="text-[13px] sm:text-[14px] font-normal text-[#DDEBE2] leading-relaxed">
                  Demonstrated using synthetic Sundar Gaun topology for the Nepalese CivicTech showcase.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar: Legal Disclaimer & Copyright Strip (#123126) */}
      <div className="border-t border-white/15 bg-[#123126] py-5">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#B8D0C4]">
            <div>
              <p>
                © {CURRENT_YEAR} PixelSquad. Developed as an open-source CivicTech prototype for Nepal.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs text-[#B8D0C4]">
              <span>Fictional Demonstration Data</span>
              <span className="text-white/30 hidden sm:inline">•</span>
              <span>Not Official Municipal Government Services</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default Footer;
