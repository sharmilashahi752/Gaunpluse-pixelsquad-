import React from 'react';
import { GraduationCap, HeartPulse, Network } from 'lucide-react';

/**
 * Infrastructure Impact Analysis Component
 * Explains how road and bridge failures affect school access, healthcare, and community connectivity.
 */
export function InfrastructureImpactAnalysis() {
  const domains = [
    {
      id: 'school',
      icon: GraduationCap,
      domain: 'School & Educational Access',
      impactMetric: '+24 min detour (+200% walk time)',
      lead: 'Student pedestrian mobility is acutely constrained by steep vertical gradients and unpaved riverbank trails.',
      findings: [
        'Under normal conditions, children from Tallo Basti walk 12 minutes along the low-gradient river corridor to Shree Janakalyan Basic School.',
        'During bridge closure or trail culvert overflow, students are rerouted over Upper Footbridge BR-01, increasing one-way commute time to 36 minutes.',
        'The detour introduces an additional 45 meters of vertical ascent across 22% hillside slopes, elevating physical fatigue and rainy-day absenteeism for 95 families.',
      ],
      affectedScope: '95 households in Tallo Basti • Janakalyan School catchment',
    },
    {
      id: 'health',
      icon: HeartPulse,
      domain: 'Healthcare Logistics & Emergency Response',
      impactMetric: '+33 min ambulance delay (2.8x increase)',
      lead: 'Emergency medical care requires four-wheel drive vehicular transit that narrow suspension footpaths cannot accommodate.',
      findings: [
        'Sundar Gaun Primary Health Post in Ward 4 serves as the only maternal and first-aid station for 1,040 residents across the valley.',
        'Closure of Khola River Motor Bridge (BR-02) prevents direct vehicular ambulance access, forcing patient transfer to hand-carried stretchers.',
        'Stretcher transit over suspended footbridges inflates clinic transit time from 18 minutes to 51 minutes, introducing acute life-safety risks during obstetric crises.',
      ],
      affectedScope: '460 residents in Tallo Basti • Health Post emergency catchment',
    },
    {
      id: 'connectivity',
      icon: Network,
      domain: 'Community Connectivity & Economic Mobility',
      impactMetric: 'Complete vehicular corridor severance',
      lead: 'Single-point bridge infrastructure links agricultural valleys to regional district trade routes.',
      findings: [
        'The Khola River divides southern residential settlements from northern road corridors connecting to municipal centers.',
        'While pedestrian suspension bridges maintain basic foot traffic, vehicular supply chains—including construction cement, seed, and ambulance dispatch—are completely blocked.',
        'Deterministic repair analysis shows that restoring motor crossings delivers a 3.4x higher community accessibility dividend than isolated trail maintenance.',
      ],
      affectedScope: 'Entire Sundar Gaun topology (1,040 residents, Wards 3 & 4)',
    },
  ];

  return (
    <section aria-labelledby="impact-heading" className="space-y-4 text-left">
      <div className="border-b border-stone-200 pb-3">
        <h2
          id="impact-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#173D32]"
        >
          Infrastructure Impact Analysis
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Systematic assessment of physical disruptions across educational access, healthcare delivery, and municipal connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {domains.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="border border-stone-200 rounded-[4px] bg-white p-5 sm:p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-[3px] bg-stone-100 flex items-center justify-center text-[#173D32]">
                    <Icon className="w-4 h-4 text-[#42866A]" />
                  </span>
                  <span className="text-[11px] font-semibold text-[#173D32] bg-stone-100 px-2 py-0.5 rounded-[2px] border border-stone-200">
                    {item.impactMetric}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#173D32] leading-snug">
                  {item.domain}
                </h3>

                <p className="text-xs text-[#1B2923]/80 leading-relaxed font-normal">
                  {item.lead}
                </p>

                <ul className="space-y-2 pt-2 border-t border-stone-100 text-xs text-[#64748B] leading-relaxed">
                  {item.findings.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#42866A] mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-stone-100 text-[11px] text-[#64748B]">
                <strong className="text-[#173D32] font-semibold">Scope:</strong> {item.affectedScope}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default InfrastructureImpactAnalysis;
