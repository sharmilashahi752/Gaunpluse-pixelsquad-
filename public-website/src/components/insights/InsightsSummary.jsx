import React, { useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Layers,
  Users,
} from 'lucide-react';
import Card from '../ui/Card';
import {
  ISSUES,
  BRIDGES,
  EDGES,
  FACILITIES,
  SETTLEMENTS,
} from '../../data/demoVillage';

/**
 * Metric summary cards computed dynamically from the shared dataset
 */
export function InsightsSummary() {
  const stats = useMemo(() => {
    const totalIssues = ISSUES.length;
    const verifiedIssues = ISSUES.filter((i) => i.verificationStatus === 'verified').length;
    const underReviewIssues = ISSUES.filter((i) => i.verificationStatus === 'under_review').length;
    const criticalIssues = ISSUES.filter((i) => i.severity === 'critical').length;
    const warningIssues = ISSUES.filter((i) => i.severity === 'warning').length;

    const totalEdges = EDGES.length;
    const totalBridges = BRIDGES.length;
    const totalFacilities = FACILITIES.length;
    const totalSettlements = SETTLEMENTS.length;

    const totalHouseholds = SETTLEMENTS.reduce((acc, s) => acc + (s.households || 0), 0);
    const totalPopulation = SETTLEMENTS.reduce(
      (acc, s) => acc + (s.estimatedPopulation || 0),
      0
    );

    return {
      totalIssues,
      verifiedIssues,
      underReviewIssues,
      criticalIssues,
      warningIssues,
      totalEdges,
      totalBridges,
      totalFacilities,
      totalSettlements,
      totalHouseholds,
      totalPopulation,
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#42866A]">
          Dataset Overview & Metric Summary
        </h3>
        <span className="text-[11px] text-[#1B2923]/60 font-medium">
          Dynamically Calculated from Sundar Gaun Graph
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Demonstration Reports */}
        <Card className="p-4 sm:p-5 bg-white/80 border-[#42866A]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32] shrink-0">
              <FileText className="w-5 h-5 text-[#173D32]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#173D32]">
                {stats.totalIssues}
              </p>
              <p className="text-xs font-semibold text-[#42866A]">
                Demonstration Reports
              </p>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-[#42866A]/10 text-[11px] text-[#1B2923]/70">
            {stats.criticalIssues} critical • {stats.warningIssues} monitored
          </p>
        </Card>

        {/* Verification Status */}
        <Card className="p-4 sm:p-5 bg-white/80 border-[#42866A]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#42866A] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#42866A]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#173D32]">
                {stats.verifiedIssues}
              </p>
              <p className="text-xs font-semibold text-[#42866A]">
                Field Verified
              </p>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-[#42866A]/10 text-[11px] text-[#1B2923]/70">
            {stats.underReviewIssues} report awaiting field check
          </p>
        </Card>

        {/* Modeled Infrastructure Assets */}
        <Card className="p-4 sm:p-5 bg-white/80 border-[#42866A]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32] shrink-0">
              <Layers className="w-5 h-5 text-[#173D32]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#173D32]">
                {stats.totalEdges}
              </p>
              <p className="text-xs font-semibold text-[#42866A]">
                Modeled Assets
              </p>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-[#42866A]/10 text-[11px] text-[#1B2923]/70">
            {stats.totalBridges} bridges • {stats.totalFacilities} civic facilities
          </p>
        </Card>

        {/* Modeled Community Settlements */}
        <Card className="p-4 sm:p-5 bg-white/80 border-[#42866A]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32] shrink-0">
              <Users className="w-5 h-5 text-[#173D32]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-[#173D32]">
                {stats.totalSettlements}
              </p>
              <p className="text-xs font-semibold text-[#42866A]">
                Fictional Settlements
              </p>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-[#42866A]/10 text-[11px] text-[#1B2923]/70">
            {stats.totalHouseholds} households (~{stats.totalPopulation.toLocaleString()} residents)
          </p>
        </Card>
      </div>
    </div>
  );
}

export default InsightsSummary;
