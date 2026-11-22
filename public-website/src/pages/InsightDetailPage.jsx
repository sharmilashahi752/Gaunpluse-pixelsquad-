import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Compass,
  CheckCircle2,
  ShieldCheck,
  User,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import Container from '../components/ui/Container';
import { getArticleById, getRelatedArticles } from '../data/researchArticles';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Dedicated Research Publication Detail Page
 * Clean, readable, editorial layout with narrow main reading column (~760px),
 * structured research sections, quantitative metrics, methodology, and related research.
 */
export function InsightDetailPage() {
  const { id } = useParams();
  const article = getArticleById(id);

  // Scroll to top upon navigating to a new article
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  const pageTitle = article
    ? `${article.title} — GaunPulse Insights`
    : 'Research Article Not Found — GaunPulse';
  useDocumentTitle(pageTitle);

  // If article not found in registry
  if (!article) {
    return (
      <div className="bg-white min-h-[70vh] flex items-center justify-center py-16">
        <Container className="max-w-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-[#173D32]">
            <FileText className="w-7 h-7 text-[#42866A]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#173D32]">
            Research Publication Not Found
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            The requested research brief or field analysis could not be located in the
            GaunPulse publication archive. It may have been updated or archived.
          </p>
          <div className="pt-2">
            <Link
              to="/insights"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#173D32] text-white text-sm font-semibold hover:bg-[#42866A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Infrastructure Insights</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(article.id, 3);

  return (
    <div className="bg-white text-[#1B2923] min-h-screen pb-20">
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-stone-200 bg-[#FBFBFA]">
        <Container className="max-w-4xl py-3.5 flex items-center gap-2 text-xs text-[#64748B]">
          <Link
            to="/insights"
            className="hover:text-[#173D32] transition-colors flex items-center gap-1 font-medium text-[#42866A]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Infrastructure Insights</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="truncate text-stone-500">{article.category}</span>
          <ChevronRight className="w-3 h-3 text-stone-400 hidden sm:inline" />
          <span className="truncate text-[#173D32] font-semibold hidden sm:inline">
            {article.title}
          </span>
        </Container>
      </div>

      {/* Main Reading Column */}
      <Container className="max-w-3xl pt-8 sm:pt-12 space-y-10 text-left">
        {/* Article Header */}
        <header className="space-y-4 border-b border-stone-200 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] bg-[#42866A]/10 px-2.5 py-0.5 rounded-[3px]">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-[3px]">
              <ShieldCheck className="w-3 h-3 text-[#42866A]" />
              Demonstration Research Brief
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#173D32] tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-[#1B2923]/80 leading-relaxed font-normal">
            {article.subtitle}
          </p>

          {/* Author and Metadata Bar */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-y-3 text-xs text-[#64748B]">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-[#173D32]">
                <User className="w-3.5 h-3.5 text-[#42866A]" />
                <span>{article.author}</span>
              </div>
              <p className="text-[11px] text-[#64748B] pl-5">{article.authorAffiliation}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#42866A]" />
                {article.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#42866A]" />
                {article.readTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#42866A]" />
                <span className="truncate max-w-[180px] sm:max-w-none">{article.location}</span>
              </span>
            </div>
          </div>
        </header>

        {/* 1. Introductory Summary (Callout) */}
        <section aria-labelledby="summary-heading" className="space-y-2">
          <h2 id="summary-heading" className="sr-only">
            Executive Summary
          </h2>
          <div className="p-5 sm:p-6 bg-[#F7F9F7] border-l-4 border-[#42866A] rounded-r-[6px] text-base sm:text-lg text-[#173D32] font-medium leading-relaxed">
            {article.summary}
          </div>
        </section>

        {/* 2. Infrastructure Photograph */}
        <figure className="space-y-2 rounded-[8px] overflow-hidden border border-stone-200 bg-stone-50 shadow-2xs">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-64 sm:h-80 md:h-96 object-cover"
          />
          <figcaption className="p-3 sm:p-4 text-xs text-[#64748B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-100 bg-white">
            <span className="font-normal">{article.imageCaption}</span>
            <span className="font-semibold text-[#173D32] shrink-0 text-[11px] uppercase tracking-wider">
              {article.location}
            </span>
          </figcaption>
        </figure>

        {/* 3. Quantitative Metric Indicators */}
        <section aria-labelledby="metrics-heading" className="space-y-3">
          <h2 id="metrics-heading" className="text-xs font-bold uppercase tracking-wider text-[#173D32]">
            Key Quantitative Indicators (Sundar Gaun Simulation)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {article.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-stone-50/80 border border-stone-200 rounded-[6px] p-4 text-left space-y-1"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block truncate">
                  {metric.label}
                </span>
                <p className="text-lg sm:text-xl font-bold text-[#173D32]">
                  {metric.value}
                </p>
                <p className="text-[11px] text-[#64748B] leading-tight">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Detailed Research Explanation */}
        <section aria-labelledby="explanation-heading" className="space-y-4">
          <h2
            id="explanation-heading"
            className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight border-b border-stone-200 pb-2.5"
          >
            Detailed Field &amp; Engineering Analysis
          </h2>
          <div className="space-y-4 text-base text-[#1B2923]/90 leading-relaxed font-normal">
            {article.explanation.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* 5. Key Research Findings */}
        <section
          aria-labelledby="findings-heading"
          className="p-6 sm:p-7 rounded-[8px] bg-stone-50/90 border border-stone-200 space-y-4 text-left"
        >
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <CheckCircle2 className="w-5 h-5 text-[#42866A]" />
            <h3
              id="findings-heading"
              className="text-lg font-bold text-[#173D32] tracking-tight"
            >
              Key Research Findings
            </h3>
          </div>
          <ul className="space-y-3">
            {article.keyFindings.map((finding, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm sm:text-base text-[#1B2923]/90 leading-relaxed"
              >
                <span className="w-2 h-2 rounded-full bg-[#42866A] mt-2 shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. On-the-Ground Community Impact */}
        <section aria-labelledby="impact-heading" className="space-y-3">
          <h2
            id="impact-heading"
            className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight border-b border-stone-200 pb-2.5"
          >
            On-the-Ground Community Impact
          </h2>
          <p className="text-base text-[#1B2923]/90 leading-relaxed font-normal">
            {article.communityImpact}
          </p>
        </section>

        {/* 7. Data Sources & Methodology */}
        <section
          aria-labelledby="methodology-heading"
          className="p-5 sm:p-6 rounded-[8px] bg-[#F7F9F7] border border-stone-200 space-y-4 text-left"
        >
          <div className="flex items-center gap-2 text-[#173D32]">
            <FileText className="w-4 h-4 text-[#42866A]" />
            <h3 id="methodology-heading" className="text-sm font-bold uppercase tracking-wider">
              Data Source, Modeling Parameters &amp; Methodology
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            {article.methodology}
          </p>

          <div className="pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/issues?search=${encodeURIComponent(article.relatedIssueTitle)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#173D32] text-white font-semibold hover:bg-[#42866A] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Related Issue Report</span>
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-white border border-stone-300 text-[#173D32] font-semibold hover:bg-stone-50 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-[#42866A]" />
                <span>Inspect on Village Map</span>
              </Link>
            </div>

            <span className="text-[11px] text-[#64748B]">
              Ref: {article.relatedInfrastructureName}
            </span>
          </div>
        </section>

        {/* 8. Related Research Publications */}
        {relatedArticles.length > 0 && (
          <section aria-labelledby="related-heading" className="space-y-4 pt-6 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h2
                id="related-heading"
                className="text-lg sm:text-xl font-bold text-[#173D32] tracking-tight"
              >
                Related Research &amp; Field Studies
              </h2>
              <Link
                to="/insights"
                className="text-xs font-semibold text-[#42866A] hover:text-[#173D32] transition-colors flex items-center gap-1"
              >
                <span>View all insights</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/insights/${rel.id}`}
                  className="group rounded-[6px] border border-stone-200 bg-white overflow-hidden shadow-2xs hover:border-[#173D32] hover:shadow-xs transition-all flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="h-32 w-full overflow-hidden bg-stone-100">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3.5 space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#42866A] block">
                        {rel.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#173D32] group-hover:text-[#42866A] transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                  </div>
                  <div className="p-3.5 pt-0 text-[11px] text-[#64748B] flex items-center justify-between border-t border-stone-100 mt-2">
                    <span>{rel.readTime}</span>
                    <span className="font-semibold text-[#173D32] group-hover:text-[#42866A] flex items-center gap-0.5">
                      Read brief &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Back Button */}
        <div className="pt-8 border-t border-stone-200 flex items-center justify-between">
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#173D32] text-white text-sm font-semibold hover:bg-[#42866A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Infrastructure Insights</span>
          </Link>
          <span className="text-xs text-[#64748B]">
            GaunPulse Evidence &amp; Insights Portal
          </span>
        </div>
      </Container>
    </div>
  );
}

export default InsightDetailPage;
