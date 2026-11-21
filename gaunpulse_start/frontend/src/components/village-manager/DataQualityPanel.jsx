import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  HelpCircle,
  Info,
  Network,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function DataQualityPanel({ village, readinessData, integrityData, onRefresh, loading }) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (onRefresh) {
      setChecking(true);
      try {
        await onRefresh();
      } finally {
        setChecking(false);
      }
    }
  };

  // Determine friendly readiness tier
  const isReady = readinessData?.can_simulate || readinessData?.is_ready_for_simulation;
  const isVerified = village?.status === 'active' && integrityData?.health_score >= 90;
  const hasErrors = (readinessData?.errors?.length || 0) > 0 || (integrityData?.issues?.length || 0) > 0;
  const hasNodes = (readinessData?.counts?.nodes || village?.nodes_count || 0) > 0;

  let qualityTier = 'getting-started';
  let qualityLabel = 'Getting Started';
  let qualityDescription = 'Add initial roads, settlements, and facilities to begin analyzing this village.';
  let QualityIcon = Info;
  let qualityColorClass = 'vm-quality-badge--getting-started';

  if (isVerified) {
    qualityTier = 'verified';
    qualityLabel = 'Verified Network';
    qualityDescription = 'Municipal field verified. High confidence topology ready for budget allocation and operational simulation.';
    QualityIcon = ShieldCheck;
    qualityColorClass = 'vm-quality-badge--verified';
  } else if (isReady) {
    qualityTier = 'ready';
    qualityLabel = 'Ready for Experimental Simulation';
    qualityDescription = 'Your village network is topologically connected. You can test road closures, landslides, and bridge disruptions in the simulator.';
    QualityIcon = Sparkles;
    qualityColorClass = 'vm-quality-badge--ready';
  } else if (hasNodes || hasErrors) {
    qualityTier = 'review';
    qualityLabel = 'Needs Review';
    qualityDescription = 'Some lifelines or facilities require connection before simulation can run with high confidence.';
    QualityIcon = AlertTriangle;
    qualityColorClass = 'vm-quality-badge--review';
  }

  // Generate plain-language checklist items
  const checklist = [];

  // Check 1: Settlements
  const settlementsCount = readinessData?.counts?.settlements || village?.settlements_count || 0;
  if (settlementsCount > 0) {
    checklist.push({
      status: 'pass',
      title: `${settlementsCount} settlement hamlets registered`,
      detail: 'Residential clusters are mapped and ready for accessibility checks.',
    });
  } else {
    checklist.push({
      status: 'fail',
      title: 'Settlement cluster needed',
      detail: 'Add at least one settlement so GaunPulse knows where households live.',
    });
  }

  // Check 2: Essential facilities
  const facilitiesCount = readinessData?.counts?.facilities || village?.facilities_count || 0;
  if (facilitiesCount > 0) {
    checklist.push({
      status: 'pass',
      title: `${facilitiesCount} essential facilities linked`,
      detail: 'Health posts, schools, and water supply points are mapped.',
    });
  } else {
    checklist.push({
      status: 'fail',
      title: 'Essential facilities need linking',
      detail: 'Connect a school or health post to see how road blocks impact citizen access.',
    });
  }

  // Check 3: Roads and bridges
  const edgesCount = readinessData?.counts?.edges || village?.edges_count || 0;
  if (edgesCount > 0) {
    checklist.push({
      status: 'pass',
      title: `${edgesCount} roads, trails & bridges active`,
      detail: 'Access lifelines are saved in the municipal database.',
    });
  } else {
    checklist.push({
      status: 'fail',
      title: 'Lifelines missing',
      detail: 'Draw or import roads and footpaths connecting settlements to facilities.',
    });
  }

  // Check 4: Connectivity & components
  const componentsCount = readinessData?.counts?.components || 1;
  if (componentsCount > 1) {
    checklist.push({
      status: 'warn',
      title: 'Some roads are not connected',
      detail: `Graph has ${componentsCount} disconnected sections. Certain settlements cannot reach the main network.`,
    });
  } else if (edgesCount > 0) {
    checklist.push({
      status: 'pass',
      title: 'Your village map is ready for basic analysis',
      detail: 'All mapped routes form a unified passable network.',
    });
  }

  // Check 5: Verification level
  checklist.push({
    status: 'info',
    title: 'Verification status: OpenStreetMap & Field Draft',
    detail: 'Imported records are experimental until verified on-site by a municipal engineer or ward committee.',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Main Quality Status Banner */}
      <div
        style={{
          background: qualityTier === 'ready' || qualityTier === 'verified' ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${qualityTier === 'ready' || qualityTier === 'verified' ? '#bbf7d0' : '#fde68a'}`,
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: qualityTier === 'ready' || qualityTier === 'verified' ? '#176342' : '#b45309',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QualityIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className={`vm-quality-badge ${qualityColorClass}`}>
                <QualityIcon size={13} /> {qualityLabel}
              </span>
              {readinessData?.routing_metric && (
                <span style={{ fontSize: '12px', color: '#687c73', fontWeight: 500 }}>
                  Metric: <strong>{readinessData.routing_metric === 'minutes' ? 'Travel Time (Minutes)' : 'Distance (Meters)'}</strong>
                </span>
              )}
            </div>
            <h3 style={{ margin: '8px 0 4px', fontSize: '18px', color: '#092d22', fontWeight: 800 }}>
              {isReady
                ? 'Your village map is ready for basic analysis'
                : 'Complete required steps to unlock full simulation'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#495a52', lineHeight: 1.5 }}>
              {qualityDescription}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheck}
          disabled={checking || loading}
          className="button button--secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            borderColor: '#c8d8cc',
            color: '#176342',
            fontWeight: 700,
            fontSize: '13px',
            padding: '10px 18px',
            borderRadius: '8px',
            alignSelf: 'center',
          }}
        >
          <RefreshCw size={15} className={checking || loading ? 'spin' : ''} />
          {checking || loading ? 'Checking Quality...' : 'Check Village Data'}
        </button>
      </div>

      {/* 2. Plain-Language Human Checklist */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dfe6df',
          borderRadius: '14px',
          padding: '20px 24px',
        }}
      >
        <h4 style={{ margin: '0 0 16px', fontSize: '15px', color: '#092d22', fontWeight: 750 }}>
          Steps to Improve Village Readiness
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checklist.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#f8faf8',
                border: '1px solid #e7ebe7',
                borderRadius: '10px',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {item.status === 'pass' && <CheckCircle2 size={18} color="#16a34a" />}
                {item.status === 'warn' && <AlertTriangle size={18} color="#d97706" />}
                {item.status === 'fail' && <AlertCircle size={18} color="#dc2626" />}
                {item.status === 'info' && <Info size={18} color="#2563eb" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#092d22' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12.5px', color: '#526359', marginTop: '2px', lineHeight: 1.4 }}>
                  {item.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Expandable Advanced Technical Details (NetworkX Engine) */}
      <details className="vm-advanced-toggle">
        <summary>
          <Cpu size={15} /> Technical NetworkX Graph Validation & Metrics
        </summary>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #dce8dd' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>GRAPH VERSION</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#092d22', fontFamily: 'monospace' }}>
                {readinessData?.graph_version || 'gp-stable-v1'}
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #dce8dd' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>ROUTING METRIC</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#092d22' }}>
                {readinessData?.routing_metric || 'distance_meters'}
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #dce8dd' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>CONNECTED COMPONENTS</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#092d22' }}>
                {readinessData?.counts?.components || 1}
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #dce8dd' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>VERIFICATION LEVEL</span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#092d22' }}>
                {readinessData?.verification_level || 'experimental'}
              </div>
            </div>
          </div>

          {readinessData?.warnings?.length > 0 && (
            <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fed7aa' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>Engine Warnings:</span>
              <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#78350f' }}>
                {readinessData.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {readinessData?.errors?.length > 0 && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>Blocking Graph Errors:</span>
              <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#991b1b' }}>
                {readinessData.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
