import React from 'react';
import { FileCheck } from 'lucide-react';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function TermsPage() {
  useDocumentTitle('Terms of Use');

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="neutral">Route: /terms</Badge>
            <Badge variant="amber">Legal / Compliance</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#173D32]">Terms of Use</h1>
          <p className="text-sm text-[#42866A] mt-1">
            Open-source and hackathon usage terms for the GaunPulse platform.
          </p>
        </div>

        <Card className="text-center py-16 border-dashed">
          <div className="w-14 h-14 rounded-full bg-[#DDEBE2] mx-auto flex items-center justify-center text-[#173D32] mb-4">
            <FileCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#173D32]">Terms of Use Placeholder</h2>
          <p className="mt-2 text-sm text-[#1B2923]/70 max-w-md mx-auto">
            Terms governing educational, community, and public showcase engagement with the 
            GaunPulse hackathon prototype.
          </p>
        </Card>
      </div>
    </Container>
  );
}

export default TermsPage;
