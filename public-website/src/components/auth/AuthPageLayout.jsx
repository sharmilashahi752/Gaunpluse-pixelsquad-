import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../layout/BrandLogo';

/**
 * Shared Balanced Two-Column Authentication Layout
 * Features:
 * - Precise 50/50 desktop split starting immediately below the navbar (0 gap)
 * - Single static image on left with object-fit: cover and subtle dark bottom gradient
 * - Consistent bottom-left text overlay typography and padding
 * - Vertically centered form container on right with consistent max-w-[500px]
 * - Fully responsive: prioritized form on mobile, seamless fit on desktop
 */
export function AuthPageLayout({
  imageSrc,
  imageAlt,
  overlayHeading,
  overlaySubtext,
  title,
  subtitle,
  children,
  isSubmitted,
  submittedContent,
}) {
  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row bg-white text-[#1B2923] overflow-x-hidden min-h-[calc(100vh-80px)]">
      {/* 1. Left Column: 50% width Single Static Image starting immediately below navbar */}
      <div className="relative w-full lg:w-1/2 h-52 sm:h-64 md:h-72 lg:h-auto lg:min-h-[calc(100vh-80px)] bg-stone-900 overflow-hidden flex flex-col justify-end self-stretch">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />

        {/* Subtle bottom-to-top gradient for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.48) 25%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0) 75%)',
          }}
        />

        {/* Text Overlay: Positioned near bottom-left with consistent padding */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 pb-8 sm:pb-10 lg:pb-12 text-left max-w-xl">
          <h2 className="text-xl sm:text-2xl lg:text-[28px] xl:text-[30px] font-medium text-white tracking-tight leading-tight">
            {overlayHeading}
          </h2>
          <p className="mt-2 text-xs sm:text-sm lg:text-base font-normal text-white/90 leading-relaxed max-w-lg">
            {overlaySubtext}
          </p>
        </div>
      </div>

      {/* 2. Right Column: 50% width Vertically Centered Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-white self-stretch">
        <div className="w-full max-w-[500px] text-left my-auto">
          {/* Brand Logo & Header */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-block mb-3.5 focus-visible:outline-2 focus-visible:outline-[#173D32]"
            >
              <BrandLogo variant="navbar" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173D32] tracking-tight">
              {title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
              {subtitle}
            </p>
          </div>

          {isSubmitted ? submittedContent : children}
        </div>
      </div>
    </div>
  );
}

export default AuthPageLayout;
