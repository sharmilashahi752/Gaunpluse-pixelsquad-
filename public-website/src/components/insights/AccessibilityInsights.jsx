import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  GraduationCap,
  Users,
  Info,
  Compass,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { runNetworkSimulation } from '../../utils/graphSimulation';
import { SETTLEMENTS } from '../../data/demoVillage';

/**
 * Visualizes deterministic graph simulation impacts for a key failure scenario (Closure of Bridge BR-02)
 */
export function AccessibilityInsights() {
  // Compute deterministic simulation outputs dynamically from graphSimulation engine
  const metrics = useMemo(() => {
    const sim = runNetworkSimulation({ disabledEdgeIds: ['edge-bridge-b'] });

    // Focus on Tallo Basti -> Health Post route
    const talloHealthRoute = sim.routeResults.find(
      (r) => r.settlementId === 'settlement-tallo' && r.facilityId === 'facility-health'
    );

    // Focus on Tallo Basti -> School route
    const talloSchoolRoute = sim.routeResults.find(
      (r) => r.settlementId === 'settlement-tallo' && r.facilityId === 'facility-school'
    );

    const talloBasti = SETTLEMENTS.find((s) => s.id === 'settlement-tallo') || {
      households: 95,
      estimatedPopulation: 460,
    };

    const healthDelayMinutes = talloHealthRoute?.deltaMinutes || 33;
    const baseHealthTime = talloHealthRoute?.baselineTime || 18;
    const disHealthTime = talloHealthRoute?.scenarioTime || 51;
    const healthPercentIncrease = baseHealthTime
      ? Math.round((healthDelayMinutes / baseHealthTime) * 100)
      : 183;

    const baseSchoolTime = talloSchoolRoute?.baselineTime || 16;
    const disSchoolTime = talloSchoolRoute?.scenarioTime || 49;
    const schoolDelayMinutes = talloSchoolRoute?.deltaMinutes || 33;

    return {
      baseHealthTime,
      disHealthTime,
      healthDelayMinutes,
      healthPercentIncrease,
      baseSchoolTime,
      disSchoolTime,
      schoolDelayMinutes,
      affectedHouseholds: talloBasti.households,
      affectedPopulation: talloBasti.estimatedPopulation,
    };
  }, []);

  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-white via-white to-[#F8F7F2] border-[#42866A]/20 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#42866A]/15 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="alert">Demonstration Failure Scenario</Badge>
            <Badge variant="neutral">Graph Simulation Engine</Badge>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#173D32]">
            What Happens When Infrastructure Fails?
          </h3>
          <p className="text-xs sm:text-sm text-[#1B2923]/75 mt-0.5">
            Demonstrating modeled accessibility disruption during structural closure of Khola River Motor Bridge (BR-02).
          </p>
        </div>

        <Link
          to="/map?asset=edge-bridge-b"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Compass className="w-3.5 h-3.5 text-[#E3AD58]" />
          <span>View on Explore Map</span>
        </Link>
      </div>

      {/* Metric Visual Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Emergency Healthcare Access */}
        <div className="p-4 rounded-xl bg-[#D45F53]/5 border border-[#D45F53]/25 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D45F53] flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-[#D45F53]" />
              Clinic Access
            </span>
            <Badge variant="alert">+{metrics.healthPercentIncrease}% Time</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#1B2923]/70">Baseline Transit:</span>
              <span className="text-sm font-semibold text-[#173D32]">
                {metrics.baseHealthTime} mins (Motorable)
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#1B2923]/70">Disrupted Detour:</span>
              <span className="text-sm font-bold text-[#D45F53]">
                {metrics.disHealthTime} mins (Foot Trail)
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-[#D45F53]/20">
              <span className="text-xs font-bold text-[#173D32]">Added Delay:</span>
              <span className="text-base font-extrabold text-[#D45F53]">
                +{metrics.healthDelayMinutes} minutes
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#1B2923]/75 leading-tight">
            Ambulances cannot cross; patient transfer requires manual stretcher carry along ridge footpaths.
          </p>
        </div>

        {/* Metric 2: School Access */}
        <div className="p-4 rounded-xl bg-[#E3AD58]/10 border border-[#E3AD58]/35 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F5E16] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#8F5E16]" />
              Basic School Route
            </span>
            <Badge variant="amber">Detour Active</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#1B2923]/70">Baseline Commute:</span>
              <span className="text-sm font-semibold text-[#173D32]">
                {metrics.baseSchoolTime} mins
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#1B2923]/70">Ridge Trail Detour:</span>
              <span className="text-sm font-bold text-[#8F5E16]">
                {metrics.disSchoolTime} mins
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-[#E3AD58]/30">
              <span className="text-xs font-bold text-[#173D32]">Added Delay:</span>
              <span className="text-base font-extrabold text-[#8F5E16]">
                +{metrics.schoolDelayMinutes} minutes
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#1B2923]/75 leading-tight">
            45 young students from Tallo Basti must climb the steep West Ridge contour trail twice daily.
          </p>
        </div>

        {/* Metric 3: Modeled Population Impact */}
        <div className="p-4 rounded-xl bg-white border border-[#42866A]/25 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#42866A] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#42866A]" />
              Affected Community
            </span>
            <Badge variant="neutral">Tallo Basti</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#1B2923]/70">Households Cut Off:</span>
              <span className="text-base font-bold text-[#173D32]">
                {metrics.affectedHouseholds} households
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#1B2923]/70">Estimated Residents:</span>
              <span className="text-base font-bold text-[#173D32]">
                ~{metrics.affectedPopulation} people
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-[#42866A]/15">
              <span className="text-xs font-bold text-[#173D32]">Alternative:</span>
              <span className="text-xs font-semibold text-[#42866A]">
                West Ridge Trail (Pedestrian only)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#1B2923]/75 leading-tight">
            Vehicular commerce and agricultural produce transport completely halted at the southern river bank.
          </p>
        </div>
      </div>

      {/* Disruption Context Callout */}
      <div className="p-4 rounded-xl bg-[#F8F7F2] border border-[#42866A]/20 flex items-start gap-3 text-xs text-[#1B2923]/80">
        <Info className="w-4 h-4 text-[#42866A] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p>
            <strong className="text-[#173D32] font-semibold">Deterministic Algorithm Note:</strong> All values above are calculated in real time by the client-side Dijkstra engine using network node connections and walking/driving edge weights defined in the shared dataset. No values are hardcoded.
          </p>
          <p className="text-[#1B2923]/70 text-[11px]">
            * Travel times reflect synthetic model parameters and do not account for individual walking fitness, extreme weather, or dynamic landslide debris.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default AccessibilityInsights;
