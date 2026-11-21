import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Container from '../ui/Container';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

/**
 * Homepage Showcase Preview: Public Bulletins & Infrastructure Analytics
 */
export function NoticesInsightsPreviewSection() {
  return (
    <section aria-labelledby="notices-insights-heading" className="py-16 sm:py-24 bg-white border-t border-[#42866A]/20">
      <Container>
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="forest">Community Broadcast & Analytics</Badge>
              <Badge variant="amber">Public Transparency</Badge>
            </div>
            <h2
              id="notices-insights-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight leading-tight"
            >
              Public Notices & Explainable Data Insights
            </h2>
            <p className="text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              Civic communication works best when open advisories and transparent analytics reinforce each other.
            </p>
          </div>

          {/* Two-Column Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: Public Notices Module */}
            <Card className="p-6 sm:p-8 bg-[#F8F7F2] border-[#42866A]/20 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32]">
                    <Bell className="w-5 h-5 text-[#42866A]" />
                  </div>
                  <Badge variant="alert">Priority Advisory Sample</Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#173D32]">
                    Public Notices & Community Bulletins
                  </h3>
                  <p className="text-xs sm:text-sm text-[#1B2923]/75 mt-1 leading-relaxed">
                    Broadcast timely physical trail warnings, bridge inspection weight limits, and seasonal road maintenance schedules so families plan safe journeys.
                  </p>
                </div>

                {/* Sample Notice Box */}
                <div className="p-4 rounded-xl bg-white border border-[#42866A]/15 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-[#42866A] font-semibold">
                    <span>GaunPulse Demonstration Notice</span>
                    <span>2026-11-20</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#173D32]">
                    Precautionary Load Guidance for Khola River Motor Bridge (BR-02)
                  </h4>
                  <p className="text-xs text-[#1B2923]/70 leading-relaxed line-clamp-2">
                    Vehicles over 2.5 tonnes advised to divert via West Ridge while foundation depth ultrasound verification is completed.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#42866A]/15 flex items-center justify-between">
                <span className="text-xs text-[#1B2923]/60 font-medium">
                  4 Active Sample Bulletins
                </span>
                <Link
                  to="/notices"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Explore Notices Board</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E3AD58]" />
                </Link>
              </div>
            </Card>

            {/* Right Card: Infrastructure Intelligence & Insights */}
            <Card className="p-6 sm:p-8 bg-[#F8F7F2] border-[#42866A]/20 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32]">
                    <BarChart3 className="w-5 h-5 text-[#42866A]" />
                  </div>
                  <Badge variant="neutral">Open Data Analytics</Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#173D32]">
                    Infrastructure Insights & Data Transparency
                  </h3>
                  <p className="text-xs sm:text-sm text-[#1B2923]/75 mt-1 leading-relaxed">
                    Synthesize complex network reports into understandable charts and explainable risk matrices without opaque black-box AI algorithms.
                  </p>
                </div>

                {/* Sample Chart Preview Metrics */}
                <div className="p-4 rounded-xl bg-white border border-[#42866A]/15 grid grid-cols-3 gap-3 text-center shadow-2xs">
                  <div>
                    <p className="text-[11px] text-[#1B2923]/60">Modeled Assets</p>
                    <p className="text-base font-extrabold text-[#173D32]">10 Total</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#1B2923]/60">Field Verified</p>
                    <p className="text-base font-extrabold text-[#42866A]">75%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#1B2923]/60">Max Delay Risk</p>
                    <p className="text-base font-extrabold text-[#D45F53]">+33 mins</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#42866A]/15 flex items-center justify-between">
                <span className="text-xs text-[#1B2923]/60 font-medium">
                  Dynamic Recharts Visualizations
                </span>
                <Link
                  to="/insights"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>View Analytics & Data Sources</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E3AD58]" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default NoticesInsightsPreviewSection;
