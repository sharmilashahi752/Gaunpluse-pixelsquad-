import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimalist Editorial Homepage Hero Section (Frame Studio Inspired)
 * Features:
 * - Truly full-screen hero directly below navbar using normal document flow (min-h-[calc(100vh-80px)] / min-h-[calc(100dvh-80px)])
 * - Background video absolutely positioned INSIDE hero container only (width 100%, height 100%, object-fit: cover)
 * - Headline video targeting local /media/gaunpulse-hero.mp4 with 45% dark overlay for crisp legibility
 * - Respects prefers-reduced-motion by pausing playback at the first frame without abstract placeholder graphics
 * - Reduced headline size: "Every Village Deserves\nto Be Heard" (~42-48px desktop, 32-38px tablet, 28-32px mobile, weight 400-500, no period)
 * - Small centered supporting paragraph (~16-17px desktop, 14-16px mobile, max-width ~650px)
 * - Two compact rectangular buttons matching Frame Studio's refined aesthetic:
 *     1. EXPLORE GAUNPULSE (black background, white text, scrolls to #how-it-works)
 *     2. EXPLORE VILLAGE MAP (white background, black text, links to /map)
 * - Removed all eyebrow badges, sparkles, decorative dots, chevrons, and glassmorphic styling
 */
export function HeroSection() {
  const videoRef = useRef(null);
  const [hasVideoError, setHasVideoError] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Dynamic listener for prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
      motionQuery.addEventListener('change', handleMotionChange);

      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }
  }, []);

  // Handle video playback respecting user preferences
  useEffect(() => {
    if (videoRef.current) {
      if (prefersReducedMotion) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } else if (!hasVideoError) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay prevented by browser security policy
          });
        }
      }
    }
  }, [prefersReducedMotion, hasVideoError]);

  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    const target = document.getElementById('how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus();
    }
  };

  return (
    <section
      aria-label="GaunPulse Hero Introduction"
      className="relative w-full min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)] flex items-center justify-center overflow-hidden bg-[#111111]"
    >
      {/* 1. Background Video Layer (Confined INSIDE hero container, never overlaps navigation) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        {!hasVideoError ? (
          <video
            ref={videoRef}
            src="/media/gaunpulse-hero.mp4"
            autoPlay={!prefersReducedMotion}
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
            onError={() => setHasVideoError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Solid neutral backdrop if video asset cannot be loaded */
          <div className="w-full h-full bg-[#111111] flex items-center justify-center text-stone-500 text-xs">
            <span>Video asset unavailable</span>
          </div>
        )}

        {/* 2. Moderate Dark Overlay for Crisp Legibility Without Excess Darkness */}
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
      </div>

      {/* 3. Centered Editorial Content Layer (Frame Studio Proportions) */}
      <div className="relative z-10 w-full max-w-[760px] mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-5 sm:space-y-6">
        {/* Main Headline (Frame Studio Proportions, No Period, Exact Line Break) */}
        <h1 className="text-[28px] sm:text-[34px] md:text-[40px] lg:text-[48px] font-normal sm:font-medium tracking-tight text-white leading-[1.15] max-w-[700px] drop-shadow-sm">
          Every Village Deserves
          <br />
          to Be Heard
        </h1>

        {/* Small Centered Supporting Paragraph */}
        <p className="text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] text-white/90 font-normal leading-relaxed max-w-[650px] drop-shadow-xs">
          Understanding infrastructure challenges. Connecting communities. Building a smarter future for rural Nepal.
        </p>

        {/* Two Compact Rectangular Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          {/* Button 1: EXPLORE GAUNPULSE */}
          <a
            href="#how-it-works"
            onClick={handleScrollToHowItWorks}
            className="w-full sm:w-auto inline-flex items-center justify-center px-[24px] py-[13px] rounded-[6px] text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.06em] bg-[#111111] hover:bg-black text-white transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            EXPLORE GAUNPULSE
          </a>

          {/* Button 2: EXPLORE VILLAGE MAP */}
          <Link
            to="/map"
            className="w-full sm:w-auto inline-flex items-center justify-center px-[24px] py-[13px] rounded-[6px] text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.06em] bg-white hover:bg-stone-100 text-[#111111] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            EXPLORE VILLAGE MAP
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
