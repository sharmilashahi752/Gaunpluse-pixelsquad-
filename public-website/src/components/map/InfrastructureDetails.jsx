import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  MapPin,
  X,
  HeartPulse,
  GraduationCap,
  Home,
  ShieldCheck,
  Route,
  Droplets,
  Landmark,
  Compass,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { ISSUES } from '../../data/demoVillage';

// Asset thumbnail locator from project assets
function getAssetImage(feature, relatedIssue) {
  if (relatedIssue) {
    if (relatedIssue.id === 'issue-bridge-b-scour') return '/images/issues/bridge-scour.png';
    if (relatedIssue.id === 'issue-upallo-trail-slump') return '/images/issues/ridge-trail.jpg';
    if (relatedIssue.id === 'issue-school-culvert') return '/images/issues/school-culvert.jpg';
    if (relatedIssue.id === 'issue-health-retaining-wall') return '/images/issues/clinic-retaining-wall.jpg';
  }
  if (feature?.id === 'bridge-b' || feature?.edgeId === 'edge-bridge-b') return '/images/issues/bridge-scour.png';
  if (feature?.id === 'bridge-a' || feature?.edgeId === 'edge-bridge-a') return '/images/about/village8.jpg';
  if (feature?.id === 'facility-school') return '/images/issues/school-culvert.jpg';
  if (feature?.id === 'facility-health') return '/images/issues/clinic-retaining-wall.jpg';
  if (feature?.id === 'settlement-tallo' || feature?.id === 'settlement-upallo') return '/images/about/village.jpg';
  if (feature?.id === 'edge-upallo-ridge-trail') return '/images/issues/ridge-trail.jpg';
  return null;
}

// Icon helper by asset type
function getCategoryIcon(type) {
  switch (type) {
    case 'bridge':
      return ShieldCheck;
    case 'school':
      return GraduationCap;
    case 'health_post':
    case 'facility':
      return HeartPulse;
    case 'settlement':
      return Home;
    case 'ward_office':
      return Landmark;
    case 'water_source':
      return Droplets;
    case 'road':
      return Route;
    case 'issue':
      return AlertTriangle;
    default:
      return Compass;
  }
}

export function InfrastructureDetails({
  selectedFeature,
  onClose,
  onSelectPreset,
}) {
  // If no feature is selected, display informative floating helper state
  if (!selectedFeature) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-5 shadow-xl text-left select-none">
        <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b border-[#E5E7EB]">
          <div className="w-7 h-7 rounded-lg bg-[#E8F0EC] flex items-center justify-center text-[#173D32]">
            <Compass className="w-4 h-4 text-[#173D32]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#173D32]">
              Infrastructure Inspector
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Geographic telemetry & status explorer
            </p>
          </div>
        </div>

        <p className="text-xs text-[#2D3748] leading-relaxed mb-4">
          Select a location or infrastructure asset to explore its details. Click any road, bridge,
          or facility marker on the map.
        </p>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
            Demonstration Presets:
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onSelectPreset('bridge-b')}
              className="w-full text-left p-2 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-50 text-xs font-semibold text-[#DC2626] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Khola Motor Bridge (BR-02)</span>
              </div>
              <span className="text-[10px] bg-red-100 text-[#DC2626] px-1.5 py-0.2 rounded font-bold">
                Critical
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreset('facility-health')}
              className="w-full text-left p-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-50 text-xs font-semibold text-[#8F5E16] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sundar Gaun Health Post</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-[#8F5E16] px-1.5 py-0.2 rounded font-bold">
                Access Risk
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreset('facility-school')}
              className="w-full text-left p-2 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] hover:bg-stone-100 text-xs font-semibold text-[#173D32] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#7C3AED]" />
                <span className="truncate">Janakalyan Basic School</span>
              </div>
              <span className="text-[10px] bg-white border border-[#E5E7EB] text-[#64748B] px-1.5 py-0.2 rounded">
                160 Students
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreset('settlement-tallo')}
              className="w-full text-left p-2 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] hover:bg-stone-100 text-xs font-semibold text-[#173D32] flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 shrink-0 text-[#173D32]" />
                <span className="truncate">Tallo Basti Settlement</span>
              </div>
              <span className="text-[10px] bg-white border border-[#E5E7EB] text-[#64748B] px-1.5 py-0.2 rounded">
                Ward 3
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#64748B]">
          <span>Demonstration Data Point</span>
          <span className="font-semibold text-[#173D32]">Sundar Gaun Network</span>
        </div>
      </div>
    );
  }

  // Look up related sample issue if available
  const relatedIssue = ISSUES.find(
    (issue) =>
      issue.id === selectedFeature.id ||
      issue.targetId === selectedFeature.id ||
      issue.edgeId === selectedFeature.id ||
      issue.targetId === selectedFeature.bridgeId ||
      issue.infrastructureId === selectedFeature.id
  );

  const assetImage = getAssetImage(selectedFeature, relatedIssue);
  const iconComponent = getCategoryIcon(selectedFeature.type || selectedFeature.category);

  const isDamaged =
    selectedFeature.isDamaged ||
    selectedFeature.status === 'critical' ||
    selectedFeature.severity === 'critical';

  const simulationTarget =
    selectedFeature.edgeId ||
    selectedFeature.bridgeId ||
    selectedFeature.targetId ||
    (selectedFeature.type === 'bridge' ? selectedFeature.id : null);

  return (
    <div className="bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xl text-left animate-in fade-in duration-150">
      {/* 1. Header: Icon, Category Badge, ID & Dismiss */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] flex items-center justify-center text-[#173D32] shrink-0">
            {React.createElement(iconComponent, { className: 'w-4 h-4 text-[#173D32]' })}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#438A70] block truncate">
                {selectedFeature.category || selectedFeature.type?.replace('_', ' ') || 'Asset'}
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                #{selectedFeature.id || selectedFeature.bridgeCode}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#173D32] truncate leading-tight">
              {selectedFeature.name || selectedFeature.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[#64748B] hover:text-[#173D32] hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
          title="Close Inspector"
          aria-label="Close feature details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Optional Asset Image Thumbnail */}
      {assetImage && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB] aspect-[16/9] max-h-36 bg-stone-100">
          <img
            src={assetImage}
            alt={selectedFeature.name || 'Asset reference'}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* 3. Status and Ward Location */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 text-[#64748B]">
          <MapPin className="w-3.5 h-3.5 text-[#438A70] shrink-0" />
          <span>{selectedFeature.ward || selectedFeature.locationLabel || 'Sundar Gaun Valley'}</span>
        </span>

        <Badge
          variant={
            isDamaged
              ? 'alert'
              : selectedFeature.status === 'warning' || selectedFeature.severity === 'warning'
              ? 'amber'
              : 'neutral'
          }
          className="text-[10px]"
        >
          {isDamaged
            ? 'Critical Incident'
            : selectedFeature.status === 'warning'
            ? 'Access Risk'
            : selectedFeature.status || 'Operational'}
        </Badge>
      </div>

      {/* 4. Description */}
      <p className="mt-2.5 text-xs text-[#2D3748] leading-relaxed">
        {selectedFeature.description || selectedFeature.summary}
      </p>

      {/* 5. Infrastructure Condition Grid */}
      <div className="mt-3 p-2.5 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] grid grid-cols-2 gap-2 text-xs">
        {selectedFeature.surface && (
          <div>
            <span className="text-[10px] text-[#64748B] font-semibold block">Surface Type</span>
            <span className="text-[#173D32] font-semibold truncate block">{selectedFeature.surface}</span>
          </div>
        )}

        {selectedFeature.length && (
          <div>
            <span className="text-[10px] text-[#64748B] font-semibold block">Span Length</span>
            <span className="text-[#173D32] font-semibold block">{selectedFeature.length}</span>
          </div>
        )}

        {selectedFeature.households && (
          <div>
            <span className="text-[10px] text-[#64748B] font-semibold block">Households</span>
            <span className="text-[#173D32] font-semibold block">{selectedFeature.households} HH</span>
          </div>
        )}

        {selectedFeature.capacity && (
          <div>
            <span className="text-[10px] text-[#64748B] font-semibold block">Enrollment</span>
            <span className="text-[#173D32] font-semibold block">{selectedFeature.capacity}</span>
          </div>
        )}

        {selectedFeature.services && (
          <div className="col-span-2">
            <span className="text-[10px] text-[#64748B] font-semibold block">Services Provided</span>
            <span className="text-[#173D32] font-medium text-[11px] block">{selectedFeature.services}</span>
          </div>
        )}

        <div className="col-span-2">
          <span className="text-[10px] text-[#64748B] font-semibold block">Verification Status</span>
          <span className="text-[#173D32] font-medium text-[11px] block">
            {selectedFeature.verificationLabel || 'Field Inspected & Logged'} (Simulated)
          </span>
        </div>
      </div>

      {/* 6. Related Community Issue Notice if applicable */}
      {relatedIssue && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
          <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Active Community Issue</span>
          </div>
          <p className="font-semibold text-[#173D32]">{relatedIssue.title}</p>
          <p className="text-[#485650] text-[11px] mt-0.5 leading-normal">{relatedIssue.summary}</p>
        </div>
      )}

      {/* 7. Working Action Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
        {relatedIssue ? (
          <Link
            to={`/issues/${relatedIssue.id}`}
            className="flex-1 py-2 px-3 rounded-[6px] bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold text-center transition-colors shadow-2xs"
          >
            View Details
          </Link>
        ) : (
          <Link
            to="/issues"
            className="flex-1 py-2 px-3 rounded-[6px] bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold text-center transition-colors shadow-2xs"
          >
            Explore Issues
          </Link>
        )}

        {simulationTarget && (
          <Link
            to={`/demo?edge=${simulationTarget}`}
            className="flex-1 py-2 px-3 rounded-[6px] bg-white border border-[#E5E7EB] hover:bg-stone-50 text-[#173D32] text-xs font-semibold text-center transition-colors inline-flex items-center justify-center gap-1"
          >
            <span>Simulate Route</span>
            <ArrowRight className="w-3 h-3 text-[#E3AD58]" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default InfrastructureDetails;
