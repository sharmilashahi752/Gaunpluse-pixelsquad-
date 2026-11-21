import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

/**
 * Homepage Showcase Preview: Community Issues & Progress Lifecycle
 */
export function IssuesPreviewSection() {
  const lifecycleSteps = [
    { num: 1, title: 'Report Submitted', desc: 'Photos & GPS tagged by citizen or liaison.' },
    { num: 2, title: 'Under Review', desc: 'Ward triage verifies registry asset ID.' },
    { num: 3, title: 'Field Verification', desc: 'Sub-engineer conducts site measurement.' },
    { num: 4, title: 'Action Proposed', desc: 'Intervention drafted for ward budget.' },
    { num: 5, title: 'Work In Progress', desc: 'Contracted maintenance crew mobilized.' },
    { num: 6, title: 'Resolved', desc: 'Structural sign-off & route reopened.' },
  ];

  return (
    <section aria-labelledby="issues-preview-heading" className="py-16 sm:py-24 bg-[#F8F7F2] border-t border-[#42866A]/20">
      <Container>
        <div className="space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="forest">Transparent Governance</Badge>
                <Badge variant="amber">6-Stage Lifecycle</Badge>
              </div>
              <h2
                id="issues-preview-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight leading-tight"
              >
                Community Issues & Progress Tracking.
              </h2>
              <p className="text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
                How does a village report turn into a verified repair? GaunPulse establishes an open, accountable 6-stage lifecycle that connects grassroots citizen observations with formal municipal engineering reviews.
              </p>
            </div>

            <Link
              to="/issues"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] shrink-0 self-start md:self-auto"
            >
              <FileText className="w-4 h-4 text-[#E3AD58]" />
              <span>Explore All Community Reports</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          {/* 6-Stage Progress Pipeline Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {lifecycleSteps.map((step) => (
              <div
                key={step.num}
                className="p-4 rounded-xl bg-white border border-[#42866A]/20 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#173D32] text-white text-[11px] font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-bold text-[#42866A]">Stage {step.num}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#173D32]">{step.title}</h4>
                </div>
                <p className="text-[11px] text-[#1B2923]/70 leading-normal">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Featured Sample Dossier Preview */}
          <Card className="p-6 bg-white border-[#42866A]/25 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Badge variant="alert">Sample Report #BR-02</Badge>
                <span className="text-xs font-semibold text-[#42866A]">Khola River Motor Bridge</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#173D32]">
                Pier Scour & Abutment Waterline Fissure
              </h3>
              <p className="text-xs text-[#1B2923]/75 max-w-2xl leading-relaxed">
                Measured 1.8m vertical void beneath pier footer following peak monsoon surge. Verified on-site by municipal technical assistant with photographic evidence and temporary load restrictions posted.
              </p>
            </div>

            <Link
              to="/issues?issue=issue-bridge-b-scour"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#42866A]/30 text-[#173D32] hover:bg-[#DDEBE2] text-xs font-bold transition-colors shrink-0"
            >
              <span>View Case Dossier</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#42866A]" />
            </Link>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default IssuesPreviewSection;
