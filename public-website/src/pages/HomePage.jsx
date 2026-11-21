import React from 'react';
import HeroSection from '../components/home/HeroSection';
import ProblemSection from '../components/home/ProblemSection';
import SolutionSection from '../components/home/SolutionSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import MapPreviewSection from '../components/home/MapPreviewSection';
import SimulatorPreviewSection from '../components/home/SimulatorPreviewSection';
import IssuesPreviewSection from '../components/home/IssuesPreviewSection';
import NoticesInsightsPreviewSection from '../components/home/NoticesInsightsPreviewSection';
import FinalCtaSection from '../components/home/FinalCtaSection';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle('Home — GaunPulse — The Village That Speaks');

  return (
    <div className="space-y-0">
      {/* 1. Existing Hero Section */}
      <HeroSection />

      {/* 2. Section 1: The Problem */}
      <ProblemSection />

      {/* 3. Section 2: The Solution */}
      <SolutionSection />

      {/* 4. Section 3: How GaunPulse Works (id="how-it-works") */}
      <HowItWorksSection />

      {/* 5. Section 4: Interactive Village Map Showcase Preview */}
      <MapPreviewSection />

      {/* 6. Section 5: Graph-Based Infrastructure Failure Simulator Preview */}
      <SimulatorPreviewSection />

      {/* 7. Section 6: Community Issues & Progress Lifecycle Preview */}
      <IssuesPreviewSection />

      {/* 8. Section 7: Public Notices & Explainable Data Insights Preview */}
      <NoticesInsightsPreviewSection />

      {/* 9. Section 8: Final Call to Action */}
      <FinalCtaSection />
    </div>
  );
}

export default HomePage;
