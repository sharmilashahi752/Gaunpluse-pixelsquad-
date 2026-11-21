import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2] text-[#1B2923] font-sans antialiased">
      {/* Sticky Main Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Shared Professional Footer */}
      <Footer />
    </div>
  );
}

export default AppLayout;
