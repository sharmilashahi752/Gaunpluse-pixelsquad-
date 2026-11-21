import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldAlert, FileText, Bell, BarChart3, Info, ArrowRight } from 'lucide-react';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import HeroSection from '../components/home/HeroSection';
import ProblemSection from '../components/home/ProblemSection';
import SolutionSection from '../components/home/SolutionSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle('Home — The Village That Speaks');

  const prototypeRoutes = [
    {
      title: 'Explore Map',
      path: '/map',
      icon: MapPin,
      desc: 'Interactive spatial map of rural infrastructure, bridges, roads, and ward facilities.',
    },
    {
      title: 'Live Demo',
      path: '/demo',
      icon: ShieldAlert,
      desc: 'Bridge-failure stress simulation and monsoon vulnerability warning showcase.',
    },
    {
      title: 'Community Issues',
      path: '/issues',
      icon: FileText,
      desc: 'Citizen reporting progress tracking and municipal response pipelines.',
    },
    {
      title: 'Insights',
      path: '/insights',
      icon: BarChart3,
      desc: 'Decision-support intelligence, isolation impact metrics, and repair prioritization.',
    },
    {
      title: 'Public Notices',
      path: '/notices',
      icon: Bell,
      desc: 'Local government notices, seasonal warnings, and repair broadcasts.',
    },
    {
      title: 'About Mission',
      path: '/about',
      icon: Info,
      desc: 'CivicTech mission, technical architecture, data ethics, and the project team.',
    },
  ];

  return (
    <div className="space-y-0">
      {/* 1. Existing Hero Section */}
      <HeroSection />

      {/* 2. Section 1: The Problem */}
      <ProblemSection />

      {/* 3. Section 2: The Solution */}
      <SolutionSection />

      {/* 4. Section 3: How GaunPulse Works (id="how-it-works") */}
      <HowItWorksSection />

      {/* 5. Prototype Route Exploration Grid */}
      <section aria-label="Portal Navigation Directory" className="py-16 sm:py-20 bg-[#F8F7F2] border-t border-[#42866A]/15">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-3 border-b border-[#42866A]/15 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#173D32]">
                Explore GaunPulse Prototype Modules
              </h2>
              <p className="text-xs sm:text-sm text-[#42866A] mt-0.5">
                Navigate the public platform sections currently under progressive implementation
              </p>
            </div>
            <Badge variant="neutral">Active Navigation Shell</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {prototypeRoutes.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden"
                >
                  <Card hover className="h-full flex flex-col justify-between border-[#42866A]/20 bg-white/80">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-[#DDEBE2] flex items-center justify-center text-[#173D32] group-hover:bg-[#173D32] group-hover:text-white transition-colors mb-3">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-base text-[#173D32] group-hover:text-[#42866A] transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#1B2923]/70 leading-normal">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#42866A]/10 flex items-center text-xs font-semibold text-[#42866A] group-hover:text-[#173D32]">
                      <span>Open Section</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}

export default HomePage;
