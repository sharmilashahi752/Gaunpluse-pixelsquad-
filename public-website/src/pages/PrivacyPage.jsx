import React from 'react';
import {
  Shield,
  Info,
  Server,
  Lock,
  Globe,
} from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function PrivacyPage() {
  useDocumentTitle('Privacy Policy — GaunPulse Prototype');

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">Prototype Policy Draft</Badge>
            <Badge variant="neutral">Open CivicTech Standards</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
            Information handling practices, third-party asset requests, and data commitments for the GaunPulse demonstration platform.
          </p>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 text-xs text-[#42866A] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              <strong>Notice:</strong> This document serves as a demonstration privacy draft. Before real municipal deployment or citizen data collection commences, this policy will be formally updated in compliance with applicable Nepalese digital privacy frameworks.
            </span>
          </div>
        </div>

        {/* Section 1: Demonstration Context */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <Globe className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">1. Demonstration & Fictional Data Context</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            GaunPulse is currently a CivicTech prototype designed for hackathon evaluation and educational demonstration. All infrastructure reports, citizen observation notes, village settlement demographics, and maintenance records shown on this website (specifically referring to "Sundar Gaun") are synthetic demonstration fixtures. No real citizen names, home locations, or live government records are stored or exposed.
          </p>
        </Card>

        {/* Section 2: Account-Free Public Access */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <Lock className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">2. No User Accounts or Personal Intake</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            Visitors can navigate the entire GaunPulse showcase—including the interactive map, graph impact simulator, issue dossiers, and public bulletins—without creating an account, registering an email address, or submitting personal identification. The website does not store tracking cookies or build marketing profiles.
          </p>
        </Card>

        {/* Section 3: Third-Party Network Requests */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <Server className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">3. Third-Party Technical Services</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            When you browse this website, your web browser makes standard HTTP network requests to external service providers to deliver visual styling and cartography:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            <li>
              <strong>OpenStreetMap Cartography:</strong> The interactive village map retrieves vector and raster map tiles directly from OpenStreetMap servers (<code>tile.openstreetmap.org</code>). Your browser transmits your standard IP address to OpenStreetMap in accordance with their <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-[#42866A] underline">Tile Usage & Privacy Policies</a>.
            </li>
            <li>
              <strong>Google Fonts:</strong> The website utilizes the open-source "Plus Jakarta Sans" typeface served through Google Fonts. Your browser communicates with Google servers to cache and render typography.
            </li>
          </ul>
        </Card>

        {/* Section 4: Future Production Transition */}
        <Card className="p-6 bg-white border-[#42866A]/20 space-y-3">
          <div className="flex items-center gap-2 text-[#173D32]">
            <Shield className="w-5 h-5 text-[#42866A]" />
            <h2 className="text-lg font-bold">4. Future Production Privacy Commitments</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            If GaunPulse transitions to a production deployment with local municipalities in Nepal, the platform will implement the following privacy safeguards:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
            <li>End-to-end cryptographic protection for citizen observation uploads.</li>
            <li>Automated location scrubbing to prevent precise GPS tracing to private households.</li>
            <li>Strict role-based access control preventing public disclosure of sensitive municipal credentials.</li>
            <li>Full compliance with local government data sovereignty policies and open data standards.</li>
          </ul>
        </Card>

        {/* Disclaimer Footer */}
        <div className="p-4 rounded-xl bg-stone-50 border border-[#42866A]/20 text-xs text-[#1B2923]/70 leading-relaxed">
          <p>
            <strong>Prototype Draft Notice:</strong> This policy is issued by the PixelSquad hackathon development team for prototype demonstration purposes. It does not constitute a formal legal contract or corporate warranty. For questions or technical review, visit our <a href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-" target="_blank" rel="noopener noreferrer" className="text-[#173D32] underline font-semibold">GitHub repository</a>.
          </p>
        </div>
      </div>
    </Container>
  );
}

export default PrivacyPage;
