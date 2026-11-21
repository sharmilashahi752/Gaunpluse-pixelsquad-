import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <div className={`min-h-screen flex flex-col bg-white text-[#1B2923] font-sans antialiased ${isMapPage ? 'h-screen overflow-hidden' : ''}`}>
      {/* Sticky Main Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main
        className={`flex-1 ${isMapPage ? 'w-full h-[calc(100vh-80px)] min-h-[calc(100vh-80px)] overflow-hidden relative' : ''}`}
        style={isMapPage ? { height: 'calc(100vh - 80px)', minHeight: 'calc(100vh - 80px)' } : undefined}
      >
        <Outlet />
      </main>

      {/* Shared Professional Footer (preserved on all pages except the full-screen map dashboard) */}
      {!isMapPage && <Footer />}
    </div>
  );
}

export default AppLayout;
