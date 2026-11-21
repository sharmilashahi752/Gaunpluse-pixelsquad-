import React, { useRef, useState, useEffect } from 'react';
import village1Img from '../../assets/village1.jpg';
import village7Img from '../../assets/village7.jpg';
import centarlPoster from '../../assets/centarl-poster.jpg';

/**
 * Editorial Gallery Homepage Section (Frame Studio "Connect With Us" Inspired)
 * Features:
 * - Centered editorial headline & uppercase wide-tracking subtitle
 * - Three equal-width media panels in horizontal row:
 *     Left: village1.jpg photograph
 *     Center: centarl.mp4 looping silent HTML5 video
 *     Right: village7.jpg photograph
 * - Uppercase captions centered below each panel
 */
export function NoticesInsightsPreviewSection() {
  const videoRef = useRef(null);
  const [hasVideoError, setHasVideoError] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

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

  return (
    <section
      id="community-notices-insights"
      aria-labelledby="notices-insights-heading"
      className="pt-[65px] pb-[65px] bg-white border-t border-stone-200/80 relative"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Header: Centered Editorial Headline & Small Uppercase Subtitle */}
        <div className="max-w-3xl mx-auto text-center mb-[46px] md:mb-[48px]">
          <h2
            id="notices-insights-heading"
            className="text-[23px] sm:text-[26px] md:text-[28px] lg:text-[31px] xl:text-[32px] font-medium sm:font-semibold text-[#173D32] tracking-tight leading-[1.2] text-center"
          >
            Stay Informed, Understand the Impact
          </h2>

          <p className="mt-[13px] sm:mt-[14px] text-[10.5px] sm:text-[11px] md:text-[12px] font-medium uppercase tracking-[0.12em] text-[#374151] text-center max-w-2xl mx-auto leading-relaxed">
            COMMUNITY NOTICES — TRANSPARENT DATA — INFORMED DECISIONS
          </p>
        </div>

        {/* 2. Gallery: Shorter Side Images & Taller Center Video Starting at Same Top Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-[26px] items-start">
          {/* Panel 1 (Left): village1 image — COMMUNITY REPORTS (Shorter) */}
          <div className="flex flex-col items-center">
            <div className="w-full h-[280px] sm:h-[320px] md:h-[320px] lg:h-[380px] xl:h-[400px] bg-stone-100 overflow-hidden">
              <img
                src={village1Img}
                alt="Nepalese mountain village settlement along a steep valley ridge"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="mt-[20px] text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-[#1B2923] text-center">
              COMMUNITY REPORTS
            </p>
          </div>

          {/* Panel 2 (Center): centarl video — BEHIND THE INSIGHTS (Taller, extending 140-180px lower) */}
          <div className="flex flex-col items-center">
            <div className="w-full h-[340px] sm:h-[380px] md:h-[460px] lg:h-[540px] xl:h-[570px] bg-stone-100 overflow-hidden relative">
              {prefersReducedMotion || hasVideoError ? (
                <img
                  src={centarlPoster}
                  alt="Rural infrastructure analytics and community connectivity overview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  poster="/media/centarl-poster.jpg"
                  onError={() => setHasVideoError(true)}
                  className="w-full h-full object-cover"
                  aria-label="Behind the insights rural data modeling preview"
                >
                  <source src="/media/centarl.mp4" type="video/mp4" />
                  <img
                    src={centarlPoster}
                    alt="Rural infrastructure insights overview"
                    className="w-full h-full object-cover"
                  />
                </video>
              )}
            </div>
            <p className="mt-[20px] text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-[#1B2923] text-center">
              BEHIND THE INSIGHTS
            </p>
          </div>

          {/* Panel 3 (Right): village7 image — CONNECTED COMMUNITIES (Shorter, exact same size as left) */}
          <div className="flex flex-col items-center">
            <div className="w-full h-[280px] sm:h-[320px] md:h-[320px] lg:h-[380px] xl:h-[400px] bg-stone-100 overflow-hidden">
              <img
                src={village7Img}
                alt="Terraced agricultural terrain and walking trails connecting rural households"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="mt-[20px] text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-[#1B2923] text-center">
              CONNECTED COMMUNITIES
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NoticesInsightsPreviewSection;
