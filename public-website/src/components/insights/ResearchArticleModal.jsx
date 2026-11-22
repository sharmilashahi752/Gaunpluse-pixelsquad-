import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Compass,
} from 'lucide-react';

const ARTICLE_DATA = {
  'school-accessibility': {
    id: 'school-accessibility',
    category: 'Educational Mobility',
    date: 'October 2026',
    readTime: '4 min read',
    title: 'How Bridge and Trail Damage Affects Rural School Attendance',
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
  'healthcare-impact': {
    id: 'healthcare-impact',
    category: 'Emergency Healthcare Logistics',
    date: 'October 2026',
    readTime: '5 min read',
    title: 'The Impact of Road & Bridge Failures on Rural Emergency Care',
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
  'infrastructure-priorities': {
    id: 'infrastructure-priorities',
    category: 'Municipal Capital Allocation',
    date: 'October 2026',
    readTime: '4 min read',
    title: 'Evidence-Based Repair Sequencing Under Municipal Budget Limits',
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
  'community-reporting': {
    id: 'community-reporting',
    category: 'Civic Governance',
    date: 'October 2026',
    readTime: '3 min read',
    title: 'Verification Integrity and Audit Trails in Community Hazard Reporting',
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
};

/**
 * Research Article Reader Modal
 * Accessible modal displaying the full article text, quantitative metrics,
 * methodology details, and links to relevant reports.
 */
export function ResearchArticleModal({ articleId, onClose }) {
  const article = articleId ? ARTICLE_DATA[articleId] : null;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!article) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white border border-stone-200 rounded-[8px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#438B70]">
              {article.category}
            </span>
            <h3 id="article-modal-title" className="text-xl sm:text-2xl font-bold text-[#173D32] leading-snug">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-[#64748B] pt-1">
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
                {article.location}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close research article"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Quantitative Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {article.metrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-stone-50 border border-stone-200 rounded-[4px] p-3 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block truncate">
                {m.label}
              </span>
              <p className="text-base sm:text-lg font-bold text-[#173D32] mt-0.5">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Full Analysis Text */}
        <div className="space-y-3.5 text-sm text-[#1B2923] leading-relaxed">
          <h4 className="text-sm font-bold text-[#173D32] border-b border-stone-100 pb-1.5">
            Complete Field &amp; Modeling Assessment
          </h4>
          {article.paragraphs.map((p, idx) => (
            <p key={idx} className="font-normal text-[#1B2923]/90">
              {p}
            </p>
          ))}
        </div>

        {/* Methodology Box */}
        <div className="bg-[#F7F9F7] border border-stone-200 rounded-[4px] p-4 text-xs text-[#64748B] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#173D32]">
            <FileText className="w-4 h-4 text-[#42866A]" />
            <span>Methodology &amp; Computational Parameters</span>
          </div>
          <p className="leading-relaxed font-normal">{article.methodologyNote}</p>
        </div>

        {/* Related Issue & Map Links */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/issues?search=${encodeURIComponent(article.relatedIssueTitle)}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold bg-[#173D32] text-white hover:bg-[#42866A] transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Related Report</span>
            </Link>

            <Link
              to="/map"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold bg-white border border-stone-300 text-[#173D32] hover:bg-stone-50 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#42866A]" />
              <span>Open Corridor Map</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[4px] text-xs font-semibold bg-stone-100 text-[#173D32] hover:bg-stone-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResearchArticleModal;
