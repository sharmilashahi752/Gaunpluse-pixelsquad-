import React from 'react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import InsightsSummary from '../components/insights/InsightsSummary';
import IssueCharts from '../components/insights/IssueCharts';
import AccessibilityInsights from '../components/insights/AccessibilityInsights';
import DataSources from '../components/insights/DataSources';
import DataFlow from '../components/insights/DataFlow';
import DataLimitations from '../components/insights/DataLimitations';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function InsightsPage() {
  useDocumentTitle('Infrastructure Insights & Data Transparency — GaunPulse');

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-10">
        {/* 1. Public Educational Introduction */}
        <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">Sample Analytics — Fictional Demonstration Data</Badge>
            <Badge variant="neutral">Open Decision-Support Architecture</Badge>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
              Understanding Village Infrastructure Through Data
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              Explore how GaunPulse could turn infrastructure reports and geographic connections
              into understandable community insights.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 text-xs text-[#42866A] flex flex-wrap items-center gap-4">
            <span>
              📊 <strong>Decision Support Goal:</strong> Rather than viewing infrastructure issues as isolated maintenance tickets, GaunPulse models how connected roads and bridges sustain daily education, healthcare, and livelihood access.
            </span>
          </div>
        </div>

        {/* 2. Dynamically Computed Summary Cards */}
        <InsightsSummary />

        {/* 3. Recharts Visualizations (Categories, Pipeline Stages, Severity) */}
        <IssueCharts />

        {/* 4. Accessibility Impact Visualization (Closure of Bridge BR-02 Scenario) */}
        <AccessibilityInsights />

        {/* 5. Data Flow Processing Diagram */}
        <DataFlow />

        {/* 6. Where Does the Data Come From? */}
        <DataSources />

        {/* 7. Responsible Use & Data Limitations */}
        <DataLimitations />
      </div>
    </Container>
  );
}

export default InsightsPage;
