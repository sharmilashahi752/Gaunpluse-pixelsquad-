import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import Navbar from './Navbar';
import Footer from './Footer';

export function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const shouldHideFooter = isMapPage || isAuthPage;
  const shouldReduceMotion = useReducedMotion();

  // Instant scroll to top on route change (except for map to maintain coordinates/view)
  useEffect(() => {
    if (!isMapPage) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, isMapPage]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-[#1B2923] font-sans antialiased ${
        isMapPage ? 'h-screen overflow-hidden' : ''
      }`}
    >
      {/* Sticky Main Navigation */}
      <Navbar />

      {/* Main Page Content with Smooth Route Transition */}
      <main
        className={`flex-1 ${
          isMapPage
            ? 'w-full h-[calc(100vh-80px)] min-h-[calc(100vh-80px)] overflow-hidden relative'
            : ''
        } ${isAuthPage ? 'w-full flex flex-col' : ''}`}
        style={
          isMapPage
            ? { height: 'calc(100vh - 80px)', minHeight: 'calc(100vh - 80px)' }
            : undefined
        }
      >
        <motion.div
          key={location.pathname}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={isMapPage ? 'w-full h-full' : 'w-full flex-1 flex flex-col'}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Shared Professional Footer (preserved on all pages except full-screen map and auth pages) */}
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

export default AppLayout;
