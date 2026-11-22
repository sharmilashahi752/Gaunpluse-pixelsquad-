import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, HeartPulse, GraduationCap, Home, Eye, Info } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Fictional Village Infrastructure Preview
 * Clearly labeled illustrative demo showcasing GaunPulse's spatial reasoning concept.
 */
export function VillagePreview() {
  const [selectedAsset, setSelectedAsset] = useState('damaged-bridge');

  // Fictional infrastructure assets
  const assets = {
    'damaged-bridge': {
      id: 'damaged-bridge',
      title: 'South Gorge Bridge (BR-02)',
      type: 'Pedestrian & Light Vehicle Bridge',
      status: 'Critical Alert',
      statusVariant: 'alert',
      issue: 'Abutment foundation scour detected following monsoon flood surge',
      impact: 'High: Isolates 140 households & blocks direct road route to the Health Post',
      action: 'Priority geotechnical assessment & emergency reinforcement advised',
      location: 'Ward 4 River Crossing (Simulated)',
    },
    'stable-bridge': {
      id: 'stable-bridge',
      title: 'North Suspension Footbridge (BR-01)',
      type: 'Steel Cable Suspension Bridge',
      status: 'Operational / Stable',
      statusVariant: 'neutral',
      issue: 'Structural sensors report normal tension. Deck clear.',
      impact: 'Normal: Serving upper trail foot traffic without restriction',
      action: 'Next scheduled visual inspection in 90 days',
      location: 'Ward 2 Ridge Crossing (Simulated)',
    },
    'health-post': {
      id: 'health-post',
      title: 'Gaun Community Health Post',
      type: 'Ward Level Clinic & First Aid Post',
      status: 'Access At Risk',
      statusVariant: 'amber',
      issue: 'Direct access road threatened if South Bridge capacity degrades',
      impact: 'Critical: Emergency medical transport detour would add 2.5 hours on foot',
      action: 'Alternate evacuation path verified on ridge trail',
      location: 'East Terrace, Ward 3 (Simulated)',
    },
    'school': {
      id: 'school',
      title: 'Shree Saraswati Basic School',
      type: 'Community Primary & Lower Secondary',
      status: 'Operational',
      statusVariant: 'neutral',
      issue: 'Building structurally intact; attendance vulnerable to river crossing safety',
      impact: 'Moderate: 65 students cross river daily from southern hamlets',
      action: 'Monsoon crossing advisory issued for student safety',
      location: 'Central Hillock, Ward 3 (Simulated)',
    },
    'settlement': {
      id: 'settlement',
      title: 'Majh Gaun Settlement Cluster',
      type: 'Rural Residential Basti (140 Families)',
      status: 'Monitored Settlement',
      statusVariant: 'neutral',
      issue: 'Slope stability normal; reliant on south corridor for market transport',
      impact: 'Economic & supply vulnerability during prolonged river cut-offs',
      action: 'Community reporting liaison active via GaunPulse portal',
      location: 'South Valley Terrace (Simulated)',
    },
  };

  const active = assets[selectedAsset] || assets['damaged-bridge'];

  return (
    <div className="relative w-full rounded-2xl bg-[#F8F7F2] border border-[#42866A]/25 shadow-md overflow-hidden transition-all duration-300">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#173D32] text-white gap-2 border-b border-[#42866A]/30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E3AD58] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E3AD58]"></span>
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            Illustrative Village Demo
          </span>
          <span className="hidden sm:inline-block text-[11px] text-[#DDEBE2]/80">
            • Conceptual Preview
          </span>
        </div>

        <div className="text-[11px] font-medium text-[#DDEBE2]/90 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#E3AD58]" />
          <span>Interactive Preview</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#EDE9DE] overflow-hidden select-none">
        <svg
          viewBox="0 0 720 480"
          className="w-full h-full object-cover"
          aria-label="Map illustration of a fictional rural Nepali village with infrastructure landmarks"
          role="img"
        >
          <defs>
            {/* Background Hill Gradients */}
            <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CCDED1" />
              <stop offset="100%" stopColor="#B4CFBC" />
            </linearGradient>
            <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DFEBE2" />
              <stop offset="100%" stopColor="#C9DDCF" />
            </linearGradient>
            <linearGradient id="mountainRidge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EBF2ED" />
              <stop offset="100%" stopColor="#D5E4D9" />
            </linearGradient>
            {/* River Gradient */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5E9689" />
              <stop offset="100%" stopColor="#487B70" />
            </linearGradient>
            {/* Road Pattern */}
            <pattern id="roadHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#D3B893" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Distant Himalayan Peaks Silhouette (Subtle) */}
          <path
            d="M0,90 L60,40 L120,80 L200,20 L270,75 L350,15 L430,70 L510,25 L590,85 L670,30 L720,70 L720,120 L0,120 Z"
            fill="url(#mountainRidge)"
            opacity="0.85"
          />

          {/* Back Hilly Terrain */}
          <path
            d="M0,110 Q140,70 300,105 T600,80 Q670,95 720,110 L720,260 L0,260 Z"
            fill="url(#hillGrad2)"
          />

          {/* Terraced Agricultural Field Contours (Pahar slopes) */}
          <g stroke="#9CBDA4" strokeWidth="1.2" fill="none" opacity="0.65">
            <path d="M20,160 Q120,135 240,155 T460,140 Q580,130 700,150" />
            <path d="M10,185 Q140,160 270,180 T500,165 Q620,160 710,175" />
            <path d="M30,210 Q160,190 300,205 T530,195 Q640,190 710,205" />
            <path d="M15,240 Q180,215 320,235 T560,225 Q650,220 720,235" />
          </g>

          {/* Middle Valley Base Layer */}
          <path
            d="M0,230 Q160,195 340,225 T720,210 L720,480 L0,480 Z"
            fill="#E3EBDD"
          />

          {/* Flowing Glacial River (Trishuli style winding river) */}
          <path
            d="M480,95 C450,160 410,210 370,270 C330,330 250,380 200,480 L270,480 C320,390 390,345 430,285 C470,225 510,170 540,95 Z"
            fill="url(#riverGrad)"
          />

          {/* River Water Detail Lines */}
          <g stroke="#88C2B3" strokeWidth="1.5" strokeDasharray="6 12" fill="none" opacity="0.7">
            <path d="M495,120 C465,180 425,230 385,290 C345,350 265,400 220,480" />
            <path d="M515,125 C485,185 445,235 405,295 C365,355 285,405 245,480" />
          </g>

          {/* Road Network (Connecting Settlement, Bridges, School, Health Post) */}
          {/* Main Ridge Road */}
          <path
            d="M60,400 Q150,370 230,350 T400,320 Q500,300 580,260 T680,200"
            stroke="#DFCAAA"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M60,400 Q150,370 230,350 T400,320 Q500,300 580,260 T680,200"
            stroke="#BCA27D"
            strokeWidth="2"
            strokeDasharray="4 6"
            fill="none"
          />

          {/* Road branch heading to Health Post and North Bridge */}
          <path
            d="M400,320 Q440,240 455,180 T490,135"
            stroke="#DFCAAA"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M400,320 Q440,240 455,180 T490,135"
            stroke="#BCA27D"
            strokeWidth="1.5"
            strokeDasharray="4 5"
            fill="none"
          />

          {/* Road branch heading to School */}
          <path
            d="M230,350 Q210,310 180,270 T150,220"
            stroke="#DFCAAA"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M230,350 Q210,310 180,270 T150,220"
            stroke="#BCA27D"
            strokeWidth="1.5"
            strokeDasharray="3 4"
            fill="none"
          />

          {/* South Road crossing the River via Damaged Bridge */}
          <path
            d="M280,380 L350,335"
            stroke="#DFCAAA"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />

          {/* ================= LANDMARK 1: OPERATIONAL NORTH BRIDGE ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedAsset('stable-bridge')}
            tabIndex={0}
            role="button"
            aria-label="Select Operational North Bridge"
            onKeyDown={(e) => e.key === 'Enter' && setSelectedAsset('stable-bridge')}
          >
            {/* Suspension Bridge Graphic */}
            <path d="M455,148 L525,128" stroke="#173D32" strokeWidth="6" strokeLinecap="round" />
            <path d="M455,148 Q490,132 525,128" stroke="#E3AD58" strokeWidth="1.5" fill="none" />
            {/* Bridge Pylons */}
            <line x1="455" y1="138" x2="455" y2="156" stroke="#173D32" strokeWidth="3" />
            <line x1="525" y1="118" x2="525" y2="136" stroke="#173D32" strokeWidth="3" />

            {/* Stable Status Badge */}
            <circle cx="490" cy="136" r="14" fill="#173D32" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="490" cy="136" r="6" fill="#42866A" />
          </g>

          {/* ================= LANDMARK 2: DAMAGED SOUTH GORGE BRIDGE (KEY FOCUS) ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedAsset('damaged-bridge')}
            tabIndex={0}
            role="button"
            aria-label="Select Damaged South Gorge Bridge"
            onKeyDown={(e) => e.key === 'Enter' && setSelectedAsset('damaged-bridge')}
          >
            {/* Bridge Structure Across River */}
            <rect x="298" y="340" width="46" height="14" rx="2" fill="#8C7A68" stroke="#5C4D3D" strokeWidth="2" transform="rotate(-32 321 347)" />
            {/* Crack / Scour Graphic on River Pier */}
            <path d="M312,352 L318,360 L315,368" stroke="#D45F53" strokeWidth="2.5" fill="none" />

            {/* Pulsing Alert Rings for Damaged Bridge */}
            <circle
              cx="318"
              cy="348"
              r="24"
              fill="#D45F53"
              opacity="0.2"
              className="motion-safe:animate-ping"
            />
            <circle
              cx="318"
              cy="348"
              r="16"
              fill="#D45F53"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              className="shadow-md"
            />
            {/* Warning Icon Inside Pin */}
            <path
              d="M318,341 L324,352 L312,352 Z"
              fill="#FFFFFF"
            />
            <circle cx="318" cy="350" r="1" fill="#D45F53" />
          </g>

          {/* ================= LANDMARK 3: HEALTH POST ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedAsset('health-post')}
            tabIndex={0}
            role="button"
            aria-label="Select Gaun Community Health Post"
            onKeyDown={(e) => e.key === 'Enter' && setSelectedAsset('health-post')}
          >
            {/* Health Post Building Graphic */}
            <rect x="580" y="220" width="38" height="26" rx="3" fill="#FFFFFF" stroke="#42866A" strokeWidth="2" />
            <polygon points="575,220 599,202 623,220" fill="#B44335" />
            {/* Red Cross Symbol on Building */}
            <rect x="596" y="228" width="6" height="12" fill="#D45F53" />
            <rect x="593" y="231" width="12" height="6" fill="#D45F53" />

            {/* Health Post Node Pin */}
            <circle cx="599" cy="200" r="13" fill="#42866A" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M599,195 L599,205 M594,200 L604,200" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* ================= LANDMARK 4: COMMUNITY SCHOOL ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedAsset('school')}
            tabIndex={0}
            role="button"
            aria-label="Select Shree Saraswati Basic School"
            onKeyDown={(e) => e.key === 'Enter' && setSelectedAsset('school')}
          >
            {/* School Building */}
            <rect x="120" y="195" width="46" height="28" rx="2" fill="#F4EFE6" stroke="#173D32" strokeWidth="2" />
            <polygon points="115,195 143,178 171,195" fill="#2A5C7E" />
            {/* Nepal Flag pole & flag */}
            <line x1="172" y1="175" x2="172" y2="195" stroke="#173D32" strokeWidth="1.5" />
            <polygon points="172,175 184,180 172,185 184,190 172,192" fill="#D45F53" />

            {/* School Pin */}
            <circle cx="143" cy="175" r="13" fill="#173D32" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M137,175 L143,171 L149,175 L143,178 Z" fill="#E3AD58" />
            <line x1="149" y1="175" x2="149" y2="180" stroke="#E3AD58" strokeWidth="1.5" />
          </g>

          {/* ================= LANDMARK 5: SETTLEMENT CLUSTER (BASTI) ================= */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedAsset('settlement')}
            tabIndex={0}
            role="button"
            aria-label="Select Majh Gaun Settlement Cluster"
            onKeyDown={(e) => e.key === 'Enter' && setSelectedAsset('settlement')}
          >
            {/* Nepali Village House Clusters with Slate/Terracotta Gables */}
            <g transform="translate(70, 340)">
              {/* House 1 */}
              <rect x="0" y="14" width="28" height="20" fill="#EAE2D5" stroke="#42866A" strokeWidth="1.5" />
              <polygon points="-2,14 14,0 30,14" fill="#9C5237" />
              {/* House 2 */}
              <rect x="32" y="18" width="24" height="18" fill="#EAE2D5" stroke="#42866A" strokeWidth="1.5" />
              <polygon points="30,18 44,5 58,18" fill="#5A6D63" />
              {/* House 3 */}
              <rect x="18" y="32" width="26" height="18" fill="#DFD6C7" stroke="#42866A" strokeWidth="1.5" />
              <polygon points="16,32 31,20 46,32" fill="#8A4A33" />
              {/* Village Chautara Tree */}
              <circle cx="62" cy="30" r="14" fill="#2E694D" opacity="0.9" />
              <circle cx="60" cy="26" r="10" fill="#42866A" />
            </g>

            {/* Settlement Pin */}
            <circle cx="105" cy="335" r="13" fill="#173D32" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M100,337 L105,331 L110,337 Z M101,337 L101,340 L109,340 L109,337 Z" fill="#E3AD58" />
          </g>

          {/* Visual Labels directly on the Map (Aesthetic & Legible) */}
          <g className="text-[10px] font-bold fill-[#173D32] pointer-events-none select-none tracking-tight">
            <text x="75" y="390" className="drop-shadow-xs">Majh Gaun Basti</text>
            <text x="110" y="235">Shree Saraswati School</text>
            <text x="560" y="260">Community Health Post</text>
            <text x="445" y="115">North Suspension Bridge</text>
            <text x="250" y="325" fill="#D45F53" className="font-extrabold">Damaged Bridge BR-02</text>
          </g>
        </svg>

        {/* Dynamic Information Overlay Card (Positioned neatly over the preview) */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-[#42866A]/30 shadow-lg text-left z-20">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#42866A]">
              Infrastructure Inspection
            </span>
            <Badge variant={active.statusVariant}>
              {active.status}
            </Badge>
          </div>

          <h4 className="font-bold text-sm text-[#173D32] leading-tight">
            {active.title}
          </h4>

          <p className="mt-1 text-xs text-[#1B2923]/80 leading-snug">
            <strong className="text-[#173D32] font-semibold">Diagnosis:</strong> {active.issue}
          </p>

          <p className="mt-1 text-[11px] text-[#42866A] font-medium leading-snug">
            <strong className="text-[#173D32] font-semibold">Community Impact:</strong> {active.impact}
          </p>

          <div className="mt-2 pt-2 border-t border-[#42866A]/15 flex items-center justify-between text-[10px] text-[#1B2923]/70">
            <span className="font-mono">{active.location}</span>
            <span className="text-[#173D32] font-semibold">AI Decision Insight</span>
          </div>
        </div>
      </div>

      {/* Interactive Switcher Footer (Allows visitors to quickly tap and inspect each asset) */}
      <div className="p-3 bg-white/70 border-t border-[#42866A]/15">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#173D32] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#42866A]" />
            Select an infrastructure node to inspect:
          </span>
          <span className="text-[11px] text-[#42866A] font-medium hidden sm:inline">
            Fictional Demonstration Topology
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedAsset('damaged-bridge')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
              selectedAsset === 'damaged-bridge'
                ? 'bg-[#D45F53] text-white shadow-xs'
                : 'bg-white text-[#D45F53] border border-[#D45F53]/30 hover:bg-[#D45F53]/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Damaged Bridge (Critical)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAsset('health-post')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
              selectedAsset === 'health-post'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'bg-white text-[#173D32] border border-[#42866A]/20 hover:bg-[#DDEBE2]'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-[#42866A]" />
            <span>Health Post</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAsset('school')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
              selectedAsset === 'school'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'bg-white text-[#173D32] border border-[#42866A]/20 hover:bg-[#DDEBE2]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#42866A]" />
            <span>School</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAsset('stable-bridge')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
              selectedAsset === 'stable-bridge'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'bg-white text-[#173D32] border border-[#42866A]/20 hover:bg-[#DDEBE2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#42866A]" />
            <span>North Bridge</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAsset('settlement')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#173D32] focus:outline-hidden ${
              selectedAsset === 'settlement'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'bg-white text-[#173D32] border border-[#42866A]/20 hover:bg-[#DDEBE2]'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-[#42866A]" />
            <span>Settlement</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VillagePreview;
