import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Compass,
  FileText,
} from 'lucide-react';

const RESEARCH_ARTICLES = [
  {
    id: 'school-accessibility',
    category: 'Educational Mobility & Pedestrian Corridors',
    date: 'October 2026 Analysis',
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
    category: 'Emergency Healthcare Logistics',
    date: 'October 2026 Analysis',
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
    category: 'Municipal Decision Support & Capital Allocation',
    date: 'October 2026 Analysis',
    title: 'Evidence-Based Repair Sequencing Under Municipal Budget Limits',
    summary:
      'Comparative evaluation demonstrating why restoring vehicular bridge capacity delivers greater community-wide recovery than isolated footpath repairs.',
    location: 'Sundar Gaun Topological Network (Wards 3 & 4)',
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
    category: 'Civic Governance & Hazard Verification',
    date: 'October 2026 Analysis',
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
      { label: 'Total Submissions', value: '4 Reports' },
      { label: 'Field Verified', value: '75% Confirmed' },
      { label: 'GPS Plotted', value: '100% Geocoded' },
      { label: 'Audit Stages', value: '6-Stage Process' },
    ],
    relatedIssueId: 'issue-upallo-trail-slump',
    relatedIssueTitle: 'Ridge Trail Slope Slump & Narrowing',
    methodologyNote:
      'Citizen reports geolocated against OpenStreetMap spatial coordinates and validated through technical inspection checklists.',
  },
];

/**
 * Text-focused Research & Analysis Section
 * Clear editorial presentation without decorative photographs.
 */
export function ResearchAnalysisArticles({ activeArticleId, onToggleArticle }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = (articleId) => {
    const url = `${window.location.origin}/insights?article=${articleId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(articleId);
        setTimeout(() => setCopiedId(null), 2500);
      });
    }
  };

  return (
    <section aria-labelledby="research-heading" className="space-y-4 text-left">
      <div className="border-b border-stone-200 pb-3">
        <h2
          id="research-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#173D32]"
        >
          Research & Analysis
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Text-focused research briefs exploring network resilience, accessibility trade-offs, and verification workflows.
        </p>
      </div>

      <div className="space-y-3">
        {RESEARCH_ARTICLES.map((article) => {
          const isExpanded = activeArticleId === article.id;

          return (
            <article
              key={article.id}
              id={`article-${article.id}`}
              className="border border-stone-200 rounded-[4px] bg-white transition-all overflow-hidden"
            >
              {/* Header Toggle */}
              <button
                type="button"
                onClick={() => onToggleArticle(article.id)}
                aria-expanded={isExpanded}
                className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 hover:bg-stone-50/70 transition-colors cursor-pointer"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#42866A]">
                      {article.category}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[#64748B] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{article.date}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#173D32] leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed font-normal">
                    {article.summary}
                  </p>
                </div>

                <div className="shrink-0 pt-1 text-[#173D32]">
                  {isExpanded ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#42866A]">
                      <span>Collapse</span>
                      <ChevronUp className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#173D32]">
                      <span>Read Brief</span>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="border-t border-stone-200 p-6 sm:p-8 space-y-6 bg-white animate-in fade-in duration-150">
                  {/* Context Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] pb-3 border-b border-stone-100">
                    <span className="inline-flex items-center gap-1.5 text-[#173D32] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#42866A]" />
                      <span>{article.location}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(article.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#173D32] hover:text-[#42866A] font-semibold cursor-pointer"
                    >
                      {copiedId === article.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span className="text-[#16A34A]">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-stone-400" />
                          <span>Share Brief</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Analytical Prose */}
                  <div className="space-y-3.5 text-xs sm:text-sm text-[#1B2923]/85 leading-relaxed font-normal">
                    {article.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Quantitative Metric Table */}
                  <div className="border border-stone-200 rounded-[3px] bg-stone-50/50 p-4 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#173D32]">
                      Derived Empirical Values
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {article.metrics.map((m) => (
                        <div key={m.label} className="bg-white p-3 rounded-[2px] border border-stone-200 text-left">
                          <p className="text-base font-bold text-[#173D32] leading-tight">
                            {m.value}
                          </p>
                          <p className="text-[11px] text-[#64748B] mt-1 font-medium leading-snug">
                            {m.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cross-Reference Links */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B]">Related Observation:</span>
                      <Link
                        to={`/issues/${article.relatedIssueId}`}
                        className="inline-flex items-center gap-1 font-bold text-[#173D32] hover:text-[#42866A] underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{article.relatedIssueTitle}</span>
                      </Link>
                    </div>

                    <Link
                      to={`/map?asset=${article.relatedIssueId}`}
                      className="inline-flex items-center gap-1 text-[#42866A] hover:underline font-semibold"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Inspect On Map</span>
                    </Link>
                  </div>

                  {/* Methodology Note */}
                  <div className="text-[11px] text-[#64748B] italic pt-1 border-t border-stone-100">
                    <strong>Methodology:</strong> {article.methodologyNote}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ResearchAnalysisArticles;
