import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Container from '../ui/Container';
import { FOOTER_LINKS } from '../../data/routes';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2] text-[#1B2923] font-sans antialiased">
      {/* Sticky Main Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <footer className="border-t border-[#42866A]/15 bg-[#DDEBE2]/30 py-8 text-sm mt-auto">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-semibold text-[#173D32]">GaunPulse — The Village That Speaks</p>
              <p className="text-xs text-[#42866A] mt-0.5">
                AI-assisted rural infrastructure intelligence & decision-support platform for Nepal
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5 text-xs text-[#173D32]/80">
              {FOOTER_LINKS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="hover:text-[#173D32] hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-[#173D32] rounded-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default AppLayout;
