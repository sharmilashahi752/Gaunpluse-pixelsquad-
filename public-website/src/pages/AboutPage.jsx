import React from 'react';
import {
  Activity,
  Heart,
  Users,
  Eye,
  CheckCircle2,
  Cpu,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  Network,
  ExternalLink,
} from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function GithubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export function AboutPage() {
  useDocumentTitle('About GaunPulse — The Village That Speaks');

  const missionPillars = [
    {
      title: 'Community Participation',
      desc: 'Empowering villagers, liaisons, and school staff to voice infrastructure concerns through simple, accessible observation channels.',
      icon: Users,
    },
    {
      title: 'Accessible Information',
      desc: 'Translating complex municipal asset data into understandable interactive maps, timelines, and public advisories.',
      icon: Eye,
    },
    {
      title: 'Evidence-Informed Planning',
      desc: 'Replacing guesswork with topological graph calculations that quantify actual travel delays and cutoff risks.',
      icon: Network,
    },
    {
      title: 'Local Government Transparency',
      desc: 'Fostering mutual trust between ward councils and community residents through open progress tracking and verifiable milestones.',
      icon: CheckCircle2,
    },
    {
      title: 'Human-Reviewed Decisions',
      desc: 'Ensuring algorithmic insights remain supportive tools for human decision-makers, never autonomous replacements for civic engineers.',
      icon: ShieldCheck,
    },
  ];

  const implementedTech = [
    {
      name: 'React 19 & Tailwind CSS',
      role: 'Interface & Design System',
      desc: 'A responsive, accessible frontend built with custom Nature + Modern design tokens tailored for rural civic technology.',
    },
    {
      name: 'Leaflet & OpenStreetMap',
      role: 'Spatial Visualization',
      desc: 'Interactive geographic maps displaying roads, bridges, hamlets, schools, and health posts with OpenStreetMap cartography.',
    },
    {
      name: 'Client-Side Graph Engine',
      role: 'Deterministic Simulation',
      desc: 'Native JavaScript implementation of Dijkstra’s shortest-path algorithm for instantaneous failure scenario calculations.',
    },
    {
      name: 'Recharts Analytics',
      role: 'Public Insights',
      desc: 'Approachable, responsive visualizations illustrating issue categories, verification statuses, and severity breakdowns.',
    },
  ];

  const plannedTech = [
    {
      name: 'Laravel & MySQL Backend',
      role: 'Proposed Municipal Service',
      desc: 'Planned relational database, role-based ward authentication, audit logs, and formal work order management.',
    },
    {
      name: 'Python & NetworkX Service',
      role: 'Advanced Topography Engine',
      desc: 'Planned geospatial analysis server for multi-ward elevation models, monsoon slope stability, and complex detour calculations.',
    },
    {
      name: 'AI Explanation Service',
      role: 'Decision-Support Layer',
      desc: 'Future grounded LLM integration designed to generate plain-language vernacular community summaries from verified field telemetry.',
    },
  ];

  return (
    <div className="py-8 sm:py-12 space-y-12 sm:space-y-16">
      <Container>
        <div className="space-y-12 sm:space-y-16">
          {/* 1. Hero Section */}
          <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="forest">GaunPulse — The Village That Speaks</Badge>
              <Badge variant="amber">CivicTech Hackathon Showcase</Badge>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#173D32] tracking-tight leading-tight">
                Building Smarter, More Connected Communities.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#1B2923]/80 leading-relaxed font-normal">
                GaunPulse explores how community reporting, infrastructure mapping, simulation, and
                AI-assisted insights could help Nepal's local governments understand problems and
                make better-informed decisions.
              </p>
            </div>
          </div>

          {/* 2. Why GaunPulse Exists (Human-Centered Narrative) */}
          <section aria-labelledby="why-exists-heading" className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#D45F53]" />
              <h2
                id="why-exists-heading"
                className="text-xs font-bold uppercase tracking-wider text-[#42866A]"
              >
                Why GaunPulse Exists
              </h2>
            </div>

            <Card className="p-6 sm:p-8 bg-gradient-to-br from-white via-white to-[#F8F7F2] border-[#42866A]/25">
              <h3 className="text-xl sm:text-2xl font-bold text-[#173D32] mb-4">
                When a Village Link Breaks, Daily Life Breaks With It.
              </h3>
              <div className="space-y-3 text-sm sm:text-base text-[#1B2923]/85 leading-relaxed max-w-3xl">
                <p>
                  In the hilly and mountainous terrains of rural Nepal, a single suspended footbridge or paved river approach is often the only viable artery connecting an entire settlement to the outside world.
                </p>
                <p>
                  When monsoon floodwaters scour a bridge footer or trigger a slope slump along a terrace trail, it is not merely concrete and stones that fail. A mother requiring emergency obstetric care is suddenly cut off from the local health post. Young schoolchildren face a treacherous 50-minute detour across unpaved mountain contours. Smallholder farmers cannot deliver fresh produce to the valley market.
                </p>
                <p>
                  GaunPulse exists to bridge the communication gap between rural citizens who experience these disruptions firsthand and municipal planners who must decide how to deploy limited seasonal maintenance resources.
                </p>
              </div>
            </Card>
          </section>

          {/* 3. Our Mission & Key Pillars */}
          <section aria-labelledby="mission-heading" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-5 h-5 text-[#42866A]" />
                <h2
                  id="mission-heading"
                  className="text-xs font-bold uppercase tracking-wider text-[#42866A]"
                >
                  Our Mission
                </h2>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#173D32]">
                Making Infrastructure Problems Easier to Identify, Prioritize, and Solve.
              </h3>
              <p className="mt-2 text-sm text-[#1B2923]/75 max-w-2xl leading-relaxed">
                GaunPulse is guided by five core principles that ensure technology serves community needs transparently and responsibly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {missionPillars.map((pillar, idx) => {
                const IconComponent = pillar.icon;
                return (
                  <Card
                    key={idx}
                    className="p-5 sm:p-6 bg-white/90 border-[#42866A]/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#DDEBE2] flex items-center justify-center text-[#173D32] mb-4">
                        <IconComponent className="w-5 h-5 text-[#42866A]" />
                      </div>
                      <h4 className="text-base font-bold text-[#173D32] mb-2">
                        {pillar.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* 4. Our Vision */}
          <section aria-labelledby="vision-heading" className="space-y-4">
            <Card className="p-6 sm:p-10 bg-[#173D32] text-white rounded-2xl relative overflow-hidden">
              <div className="max-w-2xl space-y-4 relative z-10">
                <Badge variant="amber" className="bg-[#E3AD58]/20 text-[#E3AD58] border-[#E3AD58]/40">
                  Long-Term Vision
                </Badge>
                <h3
                  id="vision-heading"
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
                >
                  A Future Where Every Village Is Heard.
                </h3>
                <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                  We envision a Nepal where no remote hamlet is left isolated in silence following an infrastructure disaster. By equipping rural communities and ward administrations with accessible digital tools, local geographic knowledge can directly inform transparent, rapid, and equitable public investments.
                </p>
              </div>

              {/* Decorative background pulse mark */}
              <div className="absolute right-[-20px] bottom-[-40px] opacity-10 pointer-events-none">
                <Activity className="w-72 h-72 text-white" />
              </div>
            </Card>
          </section>

          {/* 5. Technology Behind GaunPulse */}
          <section aria-labelledby="tech-heading" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Cpu className="w-5 h-5 text-[#42866A]" />
                <h2
                  id="tech-heading"
                  className="text-xs font-bold uppercase tracking-wider text-[#42866A]"
                >
                  Technology Architecture
                </h2>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#173D32]">
                Accessible Engineering Grounded in Open Standards.
              </h3>
              <p className="mt-2 text-sm text-[#1B2923]/75 max-w-2xl leading-relaxed">
                To maintain transparency, we clearly delineate between the working client-side prototype demonstrated today and the proposed production architecture for future civic deployments.
              </p>
            </div>

            {/* Implemented vs Planned Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Implemented Prototype */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#42866A]/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#173D32] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#42866A]" />
                    Implemented Prototype (Live Demonstration)
                  </span>
                  <Badge variant="neutral">Working Today</Badge>
                </div>

                <div className="space-y-3">
                  {implementedTech.map((tech, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-[#42866A]/20 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#173D32]">{tech.name}</h4>
                        <span className="text-[11px] font-semibold text-[#42866A]">
                          {tech.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#1B2923]/75 leading-relaxed">{tech.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Production Architecture */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#42866A]/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8F5E16] flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-[#E3AD58]" />
                    Proposed Backend & AI Architecture
                  </span>
                  <Badge variant="amber">Planned Horizon</Badge>
                </div>

                <div className="space-y-3">
                  {plannedTech.map((tech, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#F8F7F2] border border-[#E3AD58]/35 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#173D32]">{tech.name}</h4>
                        <span className="text-[11px] font-semibold text-[#8F5E16]">
                          {tech.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#1B2923]/75 leading-relaxed">{tech.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 6. Project Development Status */}
          <section aria-labelledby="status-heading" className="space-y-4">
            <Card className="p-6 sm:p-8 bg-white border-[#42866A]/20 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#42866A]" />
                <h3
                  id="status-heading"
                  className="text-lg sm:text-xl font-bold text-[#173D32]"
                >
                  From Hackathon Prototype to Real-World Impact
                </h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#1B2923]/80 leading-relaxed max-w-3xl">
                <p>
                  GaunPulse is currently presented as a functioning CivicTech proof-of-concept for the Nepalese hackathon. All village names (Sundar Gaun), resident counts, coordinate markers, and maintenance reports are synthetic demonstration data.
                </p>
                <p>
                  Transitioning from this public prototype into an operational municipal decision-support system will require rigorous real-world validation, including:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[#1B2923]/80">
                  <li>In-depth participatory user research with rural ward officers and local health liaisons.</li>
                  <li>Integration with certified GIS land surveys and national road network registries.</li>
                  <li>End-to-end data security, encryption, and citizen privacy compliance.</li>
                  <li>Institutional governance partnerships with local municipal councils.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* 7. Our Team Section */}
          <section aria-labelledby="team-heading" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-5 h-5 text-[#173D32]" />
                <h2
                  id="team-heading"
                  className="text-xs font-bold uppercase tracking-wider text-[#42866A]"
                >
                  Our Team
                </h2>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#173D32]">
                Developed by PixelSquad
              </h3>
              <p className="mt-2 text-sm text-[#1B2923]/75 max-w-2xl leading-relaxed">
                GaunPulse is designed and developed by PixelSquad, an interdisciplinary hackathon team passionate about using modern software engineering, spatial visualization, and civic technology to solve real community accessibility challenges across Nepal.
              </p>
            </div>

            <Card className="p-6 sm:p-8 bg-[#F8F7F2] border-[#42866A]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="text-lg font-bold text-[#173D32]">
                  Explore the Open-Source Project
                </h4>
                <p className="text-xs sm:text-sm text-[#1B2923]/70 max-w-lg">
                  GaunPulse is developed collaboratively on GitHub under open and transparent principles. You can inspect our code, review the simulation algorithms, or contribute ideas.
                </p>
              </div>

              <a
                href="https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173D32] hover:bg-[#122F26] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <GithubIcon className="w-4 h-4 text-white" />
                <span>PixelSquad Repository</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#E3AD58]" />
              </a>
            </Card>
          </section>
        </div>
      </Container>
    </div>
  );
}

export default AboutPage;
