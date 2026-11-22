import React from 'react';
import {
  FileText,
  AlertTriangle,
  Scale,
  ShieldAlert,
  Info,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function TermsPage() {
  useDocumentTitle('Terms of Use — GaunPulse Prototype');

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">Draft Prototype Terms</Badge>
            <Badge variant="neutral">Educational Showcase</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
            Terms of Use
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
            Conditions governing demonstration exploration, educational access, and public research use of the GaunPulse platform.
          </p>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 text-xs text-[#42866A] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              <strong>Civic Disclosure:</strong> GaunPulse is an open-source CivicTech prototype developed for hackathon presentation. These terms provide clear operating boundaries and disclaim real-world liability.
            </span>
          </div>
        </div>

        {/* Term 1: Educational and Demonstration Purpose */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <Scale className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">1. Educational & Demonstration Purpose</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            The GaunPulse platform is created exclusively for demonstration, academic discussion, and civic product showcasing. All interactive modules, simulated alerts, and data dashboards are intended to illustrate what modern rural decision-support software could look like; they do not constitute an active municipal dispatch service.
          </p>
        </Card>

        {/* Term 2: Fictional Infrastructure & Simulation Limits */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <AlertTriangle className="w-5 h-5 text-[#E3AD58]" />
            <h2 className="text-lg font-bold">2. Fictional Data & Graph Simulation Boundaries</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            All spatial nodes, bridge structures, road segments, and community reports associated with "Sundar Gaun" are synthetic fixtures. The shortest-path calculations (such as travel time delays across Bridge BR-02) are computed using static edge weights and mathematical graph approximations. They do not model real-time landslide flows, monsoon weather dynamics, river surges, or individual physical capabilities.
          </p>
        </Card>

        {/* Term 3: No Engineering or Safety Certification */}
        <Card className="p-6 bg-white border-[#D45F53]/30 space-y-3 bg-[#D45F53]/5">
          <div className="flex items-center gap-2 text-[#D45F53]">
            <ShieldAlert className="w-5 h-5 text-[#D45F53]" />
            <h2 className="text-lg font-bold">3. No Structural Engineering or Emergency Certification</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/85 leading-relaxed">
            Under no circumstances should the outputs, advisories, or status indicators on this website be used to determine whether a physical road, bridge, or mountain trail in Nepal is safe to cross. GaunPulse does not provide certified civil engineering load calculations, safety clearance certificates, or emergency evacuation directives. In real emergency situations, always consult local municipal authorities, police personnel, and emergency service responders.
          </p>
        </Card>

        {/* Term 4: No Government Approval or Authority */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <CheckCircle2 className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">4. Independent Prototype — No Municipal Authority</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            Submitting feedback, exploring demo issues, or viewing public notices within this prototype does not initiate official municipal work orders, government grievance registrations, or budget expenditures. GaunPulse is an independent software project developed by PixelSquad and does not represent any ward, municipality, or ministry of Nepal.
          </p>
        </Card>

        {/* Term 5: Third-Party Mapping Attribution */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <MapPin className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">5. Third-Party Mapping Attribution</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            Map tiles and spatial cartography displayed on the interactive map are powered by OpenStreetMap contributors under the Open Database License (ODbL). Users agree to respect all intellectual property terms and open attribution guidelines associated with OpenStreetMap and Leaflet.
          </p>
        </Card>

        {/* Term 6: Responsible Use & Feedback */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <FileText className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">6. Responsible Research Use</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            Researchers, hackathon judges, and civic technologists are welcome to inspect, benchmark, and evaluate the source code of GaunPulse via our public repository. We require that any academic citation or reference clearly identifies GaunPulse as an experimental hackathon prototype.
          </p>
        </Card>

        {/* Footer Note */}
        <div className="p-4 rounded-xl bg-stone-50 border border-[#42866A]/20 text-xs text-[#1B2923]/70 leading-relaxed">
          <p>
            <strong>Draft Notice:</strong> These terms are formulated for prototype demonstration purposes by PixelSquad. Prior to operational deployment with any municipal entity, formal legal counsel will establish binding operational agreements. For repository access, visit our <a href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-" target="_blank" rel="noopener noreferrer" className="text-[#173D32] underline font-semibold">GitHub repository</a>.
          </p>
        </div>
      </div>
    </Container>
  );
}

export default TermsPage;
