import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Container from '../components/ui/Container';
import InsightsHero from '../components/insights/InsightsHero';
import InsightsCategoryTabs from '../components/insights/InsightsCategoryTabs';
import FeaturedStory from '../components/insights/FeaturedStory';
import RuralInfrastructureGlance from '../components/insights/RuralInfrastructureGlance';
import CommunityImpactNumbers from '../components/insights/CommunityImpactNumbers';
import LatestResearchGrid from '../components/insights/LatestResearchGrid';
import MethodologyTwoColumn from '../components/insights/MethodologyTwoColumn';
import ResearchArticleModal from '../components/insights/ResearchArticleModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * GaunPulse Insights & Research Portal
 * Layout hierarchy:
 * 1. Centered clean white Hero with layered green mountain silhouettes SVG and two action buttons
 * 2. Clean horizontal category navigation tabs
 * 3. Featured research story
 * 4. Interactive charts (Rural Infrastructure at a Glance)
 * 5. Community impact numerical analysis
 * 6. Latest research articles in responsive 4-card grid
 * 7. Data sources and methodology in two-column provenance layout
 */
export function InsightsPage() {
  useDocumentTitle('Infrastructure Insights & Data — GaunPulse');
  const [searchParams, setSearchParams] = useSearchParams();
  const articleParam = searchParams.get('article');

  // Category filter state
  const [activeCategory, setActiveCategory] = useState('all');

  // Active article state derived from user click or URL parameter ?article=...
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const activeArticleId = selectedArticleId ?? articleParam ?? null;

  const handleOpenArticle = (articleId) => {
    setSelectedArticleId(articleId);
    setSearchParams({ article: articleId }, { replace: true });
  };

  const handleCloseArticle = () => {
    setSelectedArticleId(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="bg-white text-[#1B2923] min-h-screen">
      <Container className="py-8 sm:py-10 lg:py-12 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* 1. Hero Section & Category Navigation */}
        <div className="space-y-6 sm:space-y-8">
          <InsightsHero />
          <InsightsCategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* 2. Featured Story — Two-column editorial centerpiece */}
        <FeaturedStory onOpenArticle={handleOpenArticle} />

        {/* 3. Rural Infrastructure at a Glance — Two side-by-side interactive charts */}
        <RuralInfrastructureGlance />

        {/* 4. Community Impact in Numbers — Detailed indicators across settlements */}
        <CommunityImpactNumbers />

        {/* 5. Latest Research & Field Insights — Four responsive cards */}
        <LatestResearchGrid
          activeCategory={activeCategory}
          onOpenArticle={handleOpenArticle}
        />

        {/* 6. Data Sources & Methodology — Two-column layout with accordions */}
        <MethodologyTwoColumn />
      </Container>

      {/* Full Article Reader Modal (supports direct ?article=... queries) */}
      <ResearchArticleModal
        articleId={activeArticleId}
        onClose={handleCloseArticle}
      />
    </div>
  );
}

export default InsightsPage;
