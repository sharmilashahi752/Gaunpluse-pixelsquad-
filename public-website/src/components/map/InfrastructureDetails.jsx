import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Info,
  MapPin,
  X,
  HeartPulse,
  GraduationCap,
} from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { ISSUES } from '../../data/demoVillage';

export function InfrastructureDetails({ selectedFeature, onClose, onSelectPreset }) {
  // If no feature is selected, render informative helper state with preset chips
  if (!selectedFeature) {
    return (
      <Card className="bg-white/95 border-[#42866A]/20 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#DDEBE2] flex items-center justify-center text-[#173D32]">
              <Info className="w-4 h-4 text-[#42866A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#173D32]">
                Infrastructure Inspector
              </h3>
              <p className="text-[11px] text-[#42866A]">
                Click any map asset or choose a demonstration node below
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#1B2923]/75 leading-relaxed">
            Select any road polyline, suspension bridge, settlement cluster, or public facility on
            the map to inspect its condition, community impact, and topological connectivity.
          </p>

          <div className="mt-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#42866A] block">
              Quick Demonstration Presets:
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onSelectPreset('bridge-b')}
                className="w-full text-left p-2.5 rounded-xl border border-[#D45F53]/30 bg-[#D45F53]/5 hover:bg-[#D45F53]/15 transition-colors flex items-center justify-between text-xs font-semibold text-[#D45F53]"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Inspect Damaged Bridge (BR-02)</span>
                </div>
                <Badge variant="alert" className="text-[10px]">Critical</Badge>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset('facility-health')}
                className="w-full text-left p-2.5 rounded-xl border border-[#42866A]/20 bg-[#F8F7F2] hover:bg-[#DDEBE2]/60 transition-colors flex items-center justify-between text-xs font-semibold text-[#173D32]"
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#42866A] shrink-0" />
                  <span>Sundar Gaun Health Post</span>
                </div>
                <Badge variant="amber" className="text-[10px]">Access Risk</Badge>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset('facility-school')}
                className="w-full text-left p-2.5 rounded-xl border border-[#42866A]/20 bg-[#F8F7F2] hover:bg-[#DDEBE2]/60 transition-colors flex items-center justify-between text-xs font-semibold text-[#173D32]"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#173D32] shrink-0" />
                  <span>Shree Janakalyan Basic School</span>
                </div>
                <Badge variant="neutral" className="text-[10px]">160 Students</Badge>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#42866A]/15 text-[11px] text-[#1B2923]/60 flex items-center justify-between">
          <span>Demonstration Village: Sundar Gaun</span>
          <Badge variant="neutral">Schematic Map v1.0</Badge>
        </div>
      </Card>
    );
  }

  // Look up related sample issue if available
  const relatedIssue = ISSUES.find(
    (issue) =>
      issue.targetId === selectedFeature.id ||
      issue.edgeId === selectedFeature.id ||
      issue.targetId === selectedFeature.bridgeId
  );

  const isDamagedBridge =
    selectedFeature.type === 'bridge' &&
    (selectedFeature.isDamaged || selectedFeature.status === 'critical');

  return (
    <Card className="bg-white/95 border-[#42866A]/25 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between animate-in fade-in duration-200">
      <div>
        {/* Header: Type, Status & Close button */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#42866A]/15">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                selectedFeature.status === 'critical'
                  ? 'alert'
                  : selectedFeature.status === 'warning'
                  ? 'amber'
                  : 'neutral'
              }
            >
              {selectedFeature.status === 'critical'
                ? 'Critical Incident'
                : selectedFeature.status === 'warning'
                ? 'Monitored Issue'
                : 'Operational'}
            </Badge>

            <span className="text-[11px] font-mono text-[#42866A]">
              ID: {selectedFeature.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#1B2923]/60 hover:text-[#173D32] hover:bg-[#DDEBE2] transition-colors focus-visible:ring-2 focus-visible:ring-[#173D32]"
            aria-label="Close feature details panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Title & Subtitle */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-xs text-[#42866A] font-medium">
            <MapPin className="w-3.5 h-3.5" />
            <span className="capitalize">{selectedFeature.type.replace('_', ' ')}</span>
            {selectedFeature.subtype && (
              <span>• {selectedFeature.subtype.replace('_', ' ')}</span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#173D32] mt-0.5 leading-snug">
            {selectedFeature.name}
          </h3>

          {selectedFeature.nameNepali && (
            <p className="text-xs text-[#42866A] font-semibold mt-0.5">
              {selectedFeature.nameNepali}
            </p>
          )}
        </div>

        {/* Narrative Description */}
        <p className="mt-3 text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
          {selectedFeature.description}
        </p>

        {/* Specific Metadata Fields */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-[#F8F7F2] border border-[#42866A]/15">
          {selectedFeature.surface && (
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Surface Type
              </span>
              <span className="text-[#173D32] font-semibold truncate block">
                {selectedFeature.surface}
              </span>
            </div>
          )}

          {selectedFeature.length && (
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Span Length
              </span>
              <span className="text-[#173D32] font-semibold">{selectedFeature.length}</span>
            </div>
          )}

          {selectedFeature.households && (
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Settlement Size
              </span>
              <span className="text-[#173D32] font-semibold">
                {selectedFeature.households} Households (~{selectedFeature.estimatedPopulation} pop.)
              </span>
            </div>
          )}

          {selectedFeature.capacity && (
            <div>
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Enrollment
              </span>
              <span className="text-[#173D32] font-semibold">{selectedFeature.capacity}</span>
            </div>
          )}

          {selectedFeature.services && (
            <div className="col-span-2">
              <span className="text-[10px] text-[#42866A] uppercase font-bold block">
                Services Offered
              </span>
              <span className="text-[#173D32] font-medium text-[11px] block">
                {selectedFeature.services}
              </span>
            </div>
          )}
        </div>

        {/* Related Sample Issue Block */}
        {relatedIssue && (
          <div className="mt-4 p-4 rounded-xl bg-[#D45F53]/10 border border-[#D45F53]/30">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#D45F53]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Sample Community Issue Report</span>
            </div>
            <h4 className="text-xs font-bold text-[#173D32]">{relatedIssue.title}</h4>
            <p className="mt-1 text-xs text-[#1B2923]/80 leading-normal">
              {relatedIssue.summary}
            </p>
            <div className="mt-2.5 pt-2 border-t border-[#D45F53]/20 text-[11px] text-[#D45F53] font-medium leading-snug">
              <strong>Simulated Network Impact:</strong> {relatedIssue.simulatedImpact}
            </div>
          </div>
        )}

        {/* Primary CTA for Damaged Bridge: Explore Failure Simulation */}
        {isDamagedBridge && (
          <div className="mt-5">
            <Link
              to={`/demo?edge=${selectedFeature.bridgeId || selectedFeature.id}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-[#173D32] hover:bg-[#122F26] text-white shadow-sm hover:shadow-md transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#173D32] group"
            >
              <span>Explore Failure Simulation</span>
              <ArrowRight className="w-4 h-4 text-[#E3AD58] transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-center text-[10px] text-[#42866A] mt-1.5">
              Simulate route closures & isolation impact on /demo
            </p>
          </div>
        )}
      </div>

      {/* Footer Meta & Demo Label */}
      <div className="mt-5 pt-3 border-t border-[#42866A]/15 flex items-center justify-between text-[10px] text-[#1B2923]/60">
        <span>Source: Sundar Gaun Demo Network</span>
        <span className="font-semibold text-[#42866A]">Fictional Data Point</span>
      </div>
    </Card>
  );
}

export default InfrastructureDetails;
