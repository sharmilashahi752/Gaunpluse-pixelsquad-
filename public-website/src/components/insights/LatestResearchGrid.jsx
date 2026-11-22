import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { getAllArticles } from '../../data/researchArticles';
import ScrollReveal from '../ui/ScrollReveal';

/**
 * Latest Research & Field Insights Section
 * Interactive research publication area presenting 4 research cards in a responsive grid:
 * 1. Rural Bridge Connectivity and Community Access
 * 2. Landslide and Trail Safety in Mountain Settlements
 * 3. Healthcare Accessibility During Infrastructure Disruptions
 * 4. Community-Based Infrastructure Monitoring
 *
 * Each card includes category, date, title, description, relevant image, subtle hover effects,
 * and makes the entire card clickable navigating to the dedicated article page via React Router.
 */
export function LatestResearchGrid({ activeCategory = 'all' }) {
  const allArticles = useMemo(() => getAllArticles(), []);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return allArticles;
    return allArticles.filter((art) => {
      if (Array.isArray(art.categoryFilters)) {
        return art.categoryFilters.includes(activeCategory);
      }
      return art.categoryFilter === activeCategory;
    });
  }, [allArticles, activeCategory]);

  return (
    <section aria-labelledby="research-grid-heading" className="space-y-6 text-left">
      {/* Section Header */}
      <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-3 gap-2">
        <div>
          <h2
            id="research-grid-heading"
            className="scroll-mt-24 text-2xl sm:text-3xl font-bold text-[#173D32] tracking-tight"
          >
            Latest Research &amp; Field Insights
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Peer-reviewed field briefs analyzing accessibility bottlenecks, municipal prioritization, and hazard verification.
          </p>
        </div>
        <span className="text-xs text-[#64748B] font-medium shrink-0">
          Showing {filteredArticles.length} of {allArticles.length} research publications
        </span>
      </ScrollReveal>

      {/* Research Cards Grid or Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-[8px] border border-stone-200 bg-stone-50 p-8 text-center text-sm text-[#64748B] space-y-2">
          <p className="font-semibold text-[#173D32]">No research publications found under this category filter.</p>
          <p className="text-xs text-[#64748B]">Select another category or switch to "All Insights" to view all publications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {filteredArticles.map((article, idx) => (
            <ScrollReveal key={article.id} delay={idx * 0.08} className="h-full">
              <Link
                to={`/insights/${article.id}`}
                className="group rounded-[8px] border border-stone-200 bg-white overflow-hidden shadow-xs hover:border-[#173D32] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left h-full focus:outline-none focus:ring-2 focus:ring-[#173D32]/30"
              >
                <div>
                  {/* Card Image with subtle hover zoom */}
                  <div className="h-44 sm:h-48 w-full overflow-hidden bg-stone-100 relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-[3px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-xs font-semibold text-[#438B70]">
                        {article.category}
                      </span>
                      <span className="text-[#64748B] flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#42866A]" />
                        {article.date}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#173D32] group-hover:text-[#42866A] transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs sm:text-[13px] text-[#1B2923]/75 leading-relaxed font-normal line-clamp-3">
                      {article.subtitle || article.summary}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="p-5 sm:p-6 pt-0">
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#173D32] group-hover:text-[#42866A] transition-colors">
                    <span>Read Full Brief</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 duration-200" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  );
}

export default LatestResearchGrid;
