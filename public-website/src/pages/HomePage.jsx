import React from 'react';
import HeroSection from '../components/home/HeroSection';
import ProblemSection from '../components/home/ProblemSection';
import SolutionSection from '../components/home/SolutionSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import NoticesInsightsPreviewSection from '../components/home/NoticesInsightsPreviewSection';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle('Home — GaunPulse — The Village That Speaks');

  return (
    <div className="space-y-0">
      {/* 1. Existing Hero Section */}
      <HeroSection />

      {/* 2. Section 1: The Problem */}
      <ProblemSection />

      {/* 3. Section 2: The Solution & Decision-Support Pipeline */}
      <SolutionSection />

      {/* 4. Section 3: How GaunPulse Works (id="how-it-works") */}
      <HowItWorksSection />

      {/* 5. Section 4: Public Notices & Explainable Data Insights Preview */}
      <NoticesInsightsPreviewSection />
    </div>
  );
}

export default HomePage;
