import React from 'react';
import { Shield } from 'lucide-react';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function PrivacyPage() {
  useDocumentTitle('Privacy Policy');

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="neutral">Route: /privacy</Badge>
            <Badge variant="amber">Legal / Compliance</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#173D32]">Privacy Policy</h1>
          <p className="text-sm text-[#42866A] mt-1">
            GaunPulse privacy guidelines and community data safety commitments.
          </p>
        </div>

        <Card className="text-center py-16 border-dashed">
          <div className="w-14 h-14 rounded-full bg-[#DDEBE2] mx-auto flex items-center justify-center text-[#173D32] mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#173D32]">Privacy Policy Placeholder</h2>
          <p className="mt-2 text-sm text-[#1B2923]/70 max-w-md mx-auto">
            Clear documentation on how community reports, non-sensitive telemetry, and open civic 
            data are handled responsibly without storing personal identifiable citizen information.
          </p>
        </Card>
      </div>
    </Container>
  );
}

export default PrivacyPage;
