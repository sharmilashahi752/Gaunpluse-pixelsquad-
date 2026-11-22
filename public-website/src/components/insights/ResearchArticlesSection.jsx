import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  ChevronUp,
  Share2,
  Check,
  Compass,
  FileText,
  ArrowRight,
} from 'lucide-react';

const RESEARCH_ARTICLES = [
  {
    id: 'school-accessibility',
    category: 'Educational Mobility',
    topicTags: ['all', 'education', 'bridges', 'roads'],
    date: 'October 2026',
    title: 'How Bridge and Trail Damage Affects Rural School Attendance',
    summary:
      'An empirical analysis modeling student commute times from Tallo Basti to Shree Janakalyan Basic School under monsoon drainage and river crossing disruptions.',
    location: 'Sundar Gaun, Ward 3 • Janakalyan School Trail',
    paragraphs: [
      'In mid-hill rural geography, school attendance is acutely sensitive to single-point pedestrian trail disruptions. Students traveling from Tallo Basti to Shree Janakalyan Basic School normally complete a 12-minute walk along the gentle lower riverbank footpath.',
      'During monsoon flooding, sediment and rock debris obstruct the 600mm masonry culvert beneath the primary pedestrian corridor. Concurrently, foundation warnings on Khola River Motor Bridge force pedestrian students to detour across the upper valley via Upper Footbridge BR-01.',
      'Deterministic Dijkstra network traversal reveals that this detour adds 24 minutes to the one-way walk, increasing total commute duration to 36 minutes each way. Furthermore, students must climb an additional 45 meters of elevation over steep 22% hillside inclines, elevating student fatigue and accelerating weather-induced absenteeism.',
    ],
    metrics: [
      { label: 'Normal Walk', value: '12 min' },
      { label: 'Detour Duration', value: '36 min (+24 min)' },
      { label: 'Affected Households', value: '95 Families' },
      { label: 'Slope Gradient', value: '22% Incline' },
    ],
    relatedIssueId: 'issue-school-culvert',
    relatedIssueTitle: 'School Incline Drainage Pipe Obstruction',
    methodologyNote:
      'Dijkstra shortest-path algorithm applied to the Sundar Gaun elevation graph. Walking speeds calibrated at 3.2 km/h on unpaved trails.',
  },
  {
    id: 'healthcare-impact',
    category: 'Emergency Healthcare',
    topicTags: ['all', 'healthcare', 'bridges'],
    date: 'October 2026',
    title: 'The Impact of Road & Bridge Failures on Rural Emergency Care',
    summary:
      'Quantifying maternal and trauma transit delays between southern village settlements and the primary health clinic during bridge closures.',
    location: 'Sundar Gaun, Ward 4 • Khola River Corridor',
    paragraphs: [
      'Access to primary healthcare in rural Nepal depends on vehicular logistics that cannot be readily replaced by pedestrian paths. Sundar Gaun Primary Health Post in Ward 4 operates as the sole clinical facility for 1,040 residents across the valley.',
      'Khola River Motor Bridge (BR-02) provides the only crossing capable of supporting four-wheel-drive ambulances and emergency medicine supply trucks. Recent scour created a 15cm void beneath the downstream western pier, threatening complete traffic closure.',
      'Under bridge closure, emergency patients from Tallo Basti must be transferred to hand-carried stretchers and walked across the narrow Upper Suspension Bridge (BR-01). This increases clinic transit time from 18 minutes to 51 minutes—a 33-minute delay. In obstetric emergencies or acute respiratory trauma, this delay represents a life-threatening obstacle.',
    ],
    metrics: [
      { label: 'Ambulance Transit', value: '18 min' },
      { label: 'Stretcher Detour', value: '51 min (+33 min)' },
      { label: 'At-Risk Population', value: '460 Residents' },
      { label: 'Pier Scour Void', value: '15cm Sub-base' },
    ],
    relatedIssueId: 'issue-bridge-b-scour',
    relatedIssueTitle: 'Pier Scour & Abutment Fissure (BR-02)',
    methodologyNote:
      'Vehicle speeds calibrated at 15 km/h on unpaved gravel; stretcher transit modeled at 2.5 km/h over suspended footbridges.',
  },
  {
    id: 'infrastructure-priorities',
    category: 'Municipal Capital Allocation',
    topicTags: ['all', 'bridges', 'access'],
    date: 'October 2026',
    title: 'Evidence-Based Repair Sequencing Under Municipal Budget Limits',
    summary:
      'Comparative evaluation demonstrating why restoring vehicular bridge capacity delivers greater community-wide recovery than isolated footpath repairs.',
    location: 'Sundar Gaun Network (Wards 3 & 4)',
    paragraphs: [
      'Local ward offices frequently confront multiple simultaneous infrastructure failures with severely constrained municipal maintenance budgets. Traditional repair decisions often follow vocal local advocacy rather than objective network optimization.',
      'GaunPulse evaluates infrastructure interventions through deterministic marginal accessibility recovery. Under a modeled dual-closure scenario where both bridges are compromised, restoring Motor Bridge BR-02 first reopens vehicular ambulance access for 95 households and eliminates 33 minutes of transit penalty.',
      'In contrast, restoring Upper Footbridge BR-01 first only restores pedestrian walking access while leaving vehicular logistics blocked. Quantifying affected families and travel penalties provides municipal engineers with defendable, data-backed prioritization.',
    ],
    metrics: [
      { label: 'Priority Rank', value: '#1 Urgent (BR-02)' },
      { label: 'Households Unlocked', value: '95 Households' },
      { label: 'Delay Eliminated', value: '33 min / Trip' },
      { label: 'Vehicular Access', value: '100% Restored' },
    ],
    relatedIssueId: 'issue-bridge-b-scour',
    relatedIssueTitle: 'Khola River Motor Bridge Repair Plan',
    methodologyNote:
      'Marginal accessibility recovery evaluated across all mapped settlements and public facilities under dual-failure constraints.',
  },
  {
    id: 'community-reporting',
    category: 'Civic Governance',
    topicTags: ['all', 'roads', 'access'],
    date: 'October 2026',
    title: 'Verification Integrity and Audit Trails in Community Hazard Reporting',
    summary:
      'Examining how grassroots citizen observations bridge the gap between initial ground instability and official municipal engineering response.',
    location: 'Upallo Basti Ridge Trail & Ward Corridors',
    paragraphs: [
      'In fragile mountain terrain, small soil slumps, culvert siltation, and pier cracks often precede catastrophic slope collapses during heavy rainfall. Citizen reporting provides crucial early warning before failures escalate.',
      'Across the 4 demonstration reports documented in Sundar Gaun, 75% have progressed through on-site technical inspection by sub-engineers. For example, early citizen reports of soil slumping along the Upallo Basti ridge trail enabled ward officials to post warning advisories before path collapse occurred.',
      'A structured 6-stage lifecycle ensures that citizen submissions maintain a clear audit trail from initial intake through engineering review and final public notice.',
    ],
    metrics: [
      { label: 'Verification Rate', value: '75% Inspected' },
      { label: 'Lifecycle Depth', value: '6 Governance Stages' },
      { label: 'Monitored Corridors', value: '4 Key Assets' },
      { label: 'Civic Response Time', value: '< 48 Hours' },
    ],
    relatedIssueId: 'issue-ridge-landslide',
    relatedIssueTitle: 'Upallo Basti Ridge Soil Slump',
    methodologyNote:
      'Audit log tracks timestamps, technical verifier identities, and municipal engineering liaison sign-offs.',
  },
];

/**
 * Editorial Research Articles Section
 * Displays research articles in a clean two-column grid on desktop.
 * The preview shows only category, title, date, short description, and read link.
 * Detailed metrics and full analysis appear only inside the expanded reader view.
 */
export function ResearchArticlesSection({
  activeTopic = 'all',
  searchQuery = '',
  activeArticleId,
  onToggleArticle,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = (articleId, e) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('article', articleId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedId(articleId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredArticles = useMemo(() => {
    return RESEARCH_ARTICLES.filter((art) => {
      const matchesTopic =
        activeTopic === 'all' || art.topicTags.includes(activeTopic);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q) ||
        art.paragraphs.some((p) => p.toLowerCase().includes(q));
      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, searchQuery]);

  return (
    <section aria-labelledby="research-articles-heading" className="space-y-6 text-left">
      <div className="border-b border-stone-200 pb-2.5">
        <h2
          id="research-articles-heading"
          className="text-xl sm:text-2xl font-bold text-[#173D32] tracking-tight"
        >
          Research & Empirical Insights
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          In-depth research briefs analyzing accessibility barriers, municipal prioritization, and hazard verification.
        </p>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="border border-stone-200 rounded-[4px] p-8 text-center bg-stone-50 space-y-2">
          <p className="text-sm font-semibold text-[#173D32]">
            No research articles match your current topic or search filter.
          </p>
          <p className="text-xs text-[#64748B]">
            Try switching topics or clearing the search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {filteredArticles.map((article) => {
            const isExpanded = activeArticleId === article.id;
            return (
              <article
                key={article.id}
                id={`article-${article.id}`}
                className={`border rounded-[4px] bg-white transition-all flex flex-col justify-between ${
                  isExpanded
                    ? 'border-[#173D32] shadow-sm md:col-span-2 ring-1 ring-[#173D32]/20'
                    : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                {/* Article Card Preview: Category, Title, Date, Description, Link */}
                <div className="p-5 sm:p-6 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#42866A]">
                      {article.category}
                    </span>
                    <span className="text-[#64748B] flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {article.date}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-[#173D32] leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed font-normal">
                      {article.summary}
                    </p>
                  </div>

                  {/* Clean bottom action bar */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onToggleArticle(article.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173D32] hover:text-[#42866A] transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Collapse Analysis' : 'Read Analysis'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(article.id, e)}
                      className="text-[11px] text-[#64748B] hover:text-[#173D32] inline-flex items-center gap-1 transition-colors"
                      title="Share link to this brief"
                    >
                      {copiedId === article.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Full Editorial Reader (Metrics appear ONLY here!) */}
                {isExpanded && (
                  <div className="border-t border-stone-200 bg-[#FBFBFA] p-6 sm:p-8 space-y-6 text-left">
                    {/* Detailed Metrics Strip (Shown only inside expanded article) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {article.metrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-stone-200 rounded-[3px] p-2.5 text-left"
                        >
                          <span className="text-[10px] font-medium uppercase tracking-wider text-[#64748B] block truncate">
                            {m.label}
                          </span>
                          <p className="text-base font-bold text-[#173D32] mt-0.5">
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 max-w-3xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#173D32] border-b border-stone-200 pb-1.5">
                        Detailed Empirical Assessment
                      </h4>
                      {article.paragraphs.map((p, idx) => (
                        <p
                          key={idx}
                          className="text-xs sm:text-sm text-[#1B2923] leading-relaxed font-normal"
                        >
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Methodology Citation Box */}
                    <div className="bg-white border border-stone-200 rounded-[3px] p-3.5 text-xs text-[#64748B] space-y-1 max-w-3xl">
                      <div className="flex items-center gap-1.5 font-bold text-[#173D32]">
                        <FileText className="w-3.5 h-3.5 text-[#42866A]" />
                        <span>Methodology & Analytical Calibration</span>
                      </div>
                      <p className="font-normal leading-relaxed">{article.methodologyNote}</p>
                    </div>

                    {/* Cross-Link to Issues or Map */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Link
                        to={`/issues?search=${encodeURIComponent(article.relatedIssueTitle)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold bg-[#173D32] text-white hover:bg-[#42866A] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Related Hazard Report</span>
                      </Link>

                      <Link
                        to="/map"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold bg-white border border-stone-300 text-[#173D32] hover:bg-stone-50 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#42866A]" />
                        <span>Open Interactive Corridor Map</span>
                      </Link>

                      <span className="text-xs text-[#64748B] flex items-center gap-1 ml-auto">
                        <MapPin className="w-3.5 h-3.5 text-[#42866A]" />
                        {article.location}
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ResearchArticlesSection;
