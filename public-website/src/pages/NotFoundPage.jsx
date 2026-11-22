import React from 'react';
import { Compass, Home } from 'lucide-react';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page Not Found');

  return (
    <Container className="py-12">
      <div className="max-w-xl mx-auto">
        <Card className="text-center p-8 sm:p-12 border-[#42866A]/20">
          <div className="w-16 h-16 rounded-full bg-[#D45F53]/15 mx-auto flex items-center justify-center text-[#D45F53] mb-5">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>

          <Badge variant="alert" className="mb-3">
            404 Error
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173D32]">
            Page Not Found
          </h1>

          <p className="mt-3 text-sm text-[#1B2923]/70 leading-relaxed">
            The trail you followed doesn't exist or has moved. Explore the registered GaunPulse prototype
            routes from the main portal.
          </p>

          <div className="mt-8 flex justify-center">
            <Button to="/" variant="primary" size="md" className="gap-2">
              <Home className="w-4 h-4" />
              <span>Return to GaunPulse Home</span>
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}

export default NotFoundPage;
