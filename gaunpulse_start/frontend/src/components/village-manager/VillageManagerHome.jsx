import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Filter,
  Globe,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Network,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Waypoints,
  Wrench,
} from 'lucide-react';
import { deduplicateVillages, formatVillageLabel } from '../../utils/villageUtils';
import ReviewDuplicatesModal from './ReviewDuplicatesModal';

export default function VillageManagerHome({
  villages = [],
  loading = false,
  onOpenAddWizard,
  onOpenVillage,
  onOpenImportModal,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  // Deduplicate villages so each genuine geographical village appears once (Step 5 & 7)
  const cleanVillages = useMemo(() => deduplicateVillages(villages), [villages]);
  const duplicateCount = villages.length - cleanVillages.length;

  // Extract unique municipalities for filter dropdown
  const uniqueMunicipalities = Array.from(
    new Set(cleanVillages.map((v) => v.municipality).filter(Boolean))
  ).sort();

  // Filter villages by search and municipality
  const filteredVillages = cleanVillages.filter((v) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.name?.toLowerCase().includes(q) ||
      v.local_name?.toLowerCase().includes(q) ||
      v.municipality?.toLowerCase().includes(q) ||
      v.district?.toLowerCase().includes(q) ||
      String(v.ward_no).includes(q);

    const matchesMuni =
      municipalityFilter === 'all' || v.municipality === municipalityFilter;

    return matchesSearch && matchesMuni;
  });

  return (
    <div className="vm-home">
      {/* 1. Lush Forest Hero Banner */}
      <div className="vm-hero">
        <div className="vm-hero__content">
          <span className="vm-hero__badge">
            <Sparkles size={14} /> Real Nepal Village Stewardship
          </span>
          <h1 className="vm-hero__title">Village Data Manager</h1>
          <p className="vm-hero__subtitle">
            Manage your villages and infrastructure in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenAddWizard && onOpenAddWizard()}
          className="vm-hero__btn"
        >
          <Plus size={18} /> + Add New Village
        </button>
      </div>

      {/* 2. Four Clear Action Cards */}
      <div className="vm-actions-grid">
        {/* Action 1: Explore Villages */}
        <div
          className="vm-action-card"
          role="button"
          tabIndex={0}
          onClick={() => {
            const el = document.getElementById('saved-villages-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
        >
          <div className="vm-action-card__icon">
            <Compass size={22} />
          </div>
          <h3 className="vm-action-card__title">1. Explore Villages</h3>
          <p className="vm-action-card__desc">
            Browse registered rural settlements across Nepal with live municipality and ward boundaries.
          </p>
          <span className="vm-action-card__link">
            {villages.length} Villages Registered <ArrowRight size={14} />
          </span>
        </div>

        {/* Action 2: Manage Infrastructure */}
        <div
          className="vm-action-card"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (villages.length > 0) {
              onOpenVillage(villages[0]);
            } else {
              onOpenAddWizard();
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
        >
          <div className="vm-action-card__icon vm-action-card__icon--blue">
            <Wrench size={22} />
          </div>
          <h3 className="vm-action-card__title">2. Manage Infrastructure</h3>
          <p className="vm-action-card__desc">
            Add, update, or edit roads, suspension bridges, schools, health clinics, and gravity water pipes.
          </p>
          <span className="vm-action-card__link">
            Open Editor <ArrowRight size={14} />
          </span>
        </div>

        {/* Action 3: Import Map Data */}
        <div
          className="vm-action-card"
          role="button"
          tabIndex={0}
          onClick={() => onOpenImportModal && onOpenImportModal()}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
        >
          <div className="vm-action-card__icon vm-action-card__icon--amber">
            <Upload size={22} />
          </div>
          <h3 className="vm-action-card__title">3. Import Map Data</h3>
          <p className="vm-action-card__desc">
            Automatically discover OpenStreetMap features or upload custom municipal GeoJSON polygons.
          </p>
          <span className="vm-action-card__link">
            Start Import <ArrowRight size={14} />
          </span>
        </div>

        {/* Action 4: Check Data Quality */}
        <div
          className="vm-action-card"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (villages.length > 0) {
              onOpenVillage(villages[0], 'quality');
            } else {
              onOpenAddWizard();
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
        >
          <div className="vm-action-card__icon vm-action-card__icon--purple">
            <ShieldCheck size={22} />
          </div>
          <h3 className="vm-action-card__title">4. Check Data Quality</h3>
          <p className="vm-action-card__desc">
            Evaluate connectivity health, isolated clusters, and simulation readiness in plain English.
          </p>
          <span className="vm-action-card__link">
            Verify Readiness <ArrowRight size={14} />
          </span>
        </div>
      </div>

      {/* Administrative Notice: Duplicate Village Records in MySQL */}
      {duplicateCount > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#b45309" />
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
              <strong>Administrative Duplicate Audit:</strong> {duplicateCount} duplicate village registrations detected in MySQL. Clean unique records are presented below.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDuplicatesModal(true)}
            className="button button--secondary"
            style={{
              fontSize: '12.5px',
              padding: '6px 14px',
              background: '#ffffff',
              color: '#b45309',
              borderColor: '#fde68a',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Database size={14} /> Review & Consolidate ({duplicateCount})
          </button>
        </div>
      )}

      {/* 3. Search and Filter Toolbar */}
      <div id="saved-villages-section" className="vm-toolbar">
        <div className="vm-search-box">
          <Search size={16} color="#7d8f85" />
          <input
            type="text"
            placeholder="Search villages by name, municipality, district, or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="vm-filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={15} color="#495a52" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#495a52' }}>Municipality:</span>
            <select
              value={municipalityFilter}
              onChange={(e) => setMunicipalityFilter(e.target.value)}
              className="vm-filter-select"
            >
              <option value="all">All Municipalities ({villages.length})</option>
              {uniqueMunicipalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="button button--secondary"
            style={{ fontSize: '12.5px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* 4. Searchable Saved Villages Grid */}
      {filteredVillages.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #dfe6df',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f0f7f3',
              color: '#176342',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={26} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#092d22', fontWeight: 800 }}>
            {search || municipalityFilter !== 'all' ? 'No matching villages found' : 'No villages registered yet'}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#687c73', maxWidth: '440px' }}>
            {search || municipalityFilter !== 'all'
              ? 'Try adjusting your search terms or municipality filter.'
              : 'Get started by creating your first village and discovering its road and facility network.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddWizard && onOpenAddWizard()}
            className="button button--primary"
            style={{
              marginTop: '6px',
              background: '#176342',
              color: '#ffffff',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} /> + Add New Village
          </button>
        </div>
      ) : (
        <div className="vm-villages-grid">
          {filteredVillages.map((v) => {
            const isDraft = v.status === 'draft';
            const totalInfra = (v.nodes_count || 0) + (v.edges_count || 0) + (v.facilities_count || 0);

            // Determine data completeness status: distinguish field verification from technical topology
            let statusBadgeClass = 'vm-quality-badge--getting-started';
            let statusLabel = 'Getting Started';
            if (isDraft) {
              statusBadgeClass = 'vm-quality-badge--draft';
              statusLabel = `Draft (Step ${v.onboarding_step || 1}/4)`;
            } else if (v.verification_status === 'verified' || v.is_verified) {
              statusBadgeClass = 'vm-quality-badge--verified';
              statusLabel = 'Verified Network';
            } else if (v.nodes_count > 0 && v.edges_count > 0) {
              statusBadgeClass = 'vm-quality-badge--ready';
              statusLabel = 'Ready for Simulation';
            } else if (totalInfra > 0) {
              statusBadgeClass = 'vm-quality-badge--review';
              statusLabel = 'Needs Review';
            }

            const updatedDate = v.updated_at
              ? new Date(v.updated_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recently';

            return (
              <div key={v.id} className="vm-village-card">
                <div className="vm-village-card__header">
                  <div className="vm-village-card__title-wrap">
                    <h3 className="vm-village-card__name">{v.name}</h3>
                    {v.local_name && (
                      <p className="vm-village-card__local-name">{v.local_name}</p>
                    )}
                    <div className="vm-village-card__location">
                      <MapPin size={13} color="#176342" />
                      <span>
                        {v.municipality} (Ward {v.ward_no || '1'}) · {v.district}
                      </span>
                    </div>
                  </div>
                  <span className={`vm-quality-badge ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Real Infrastructure Counts Breakdown */}
                <div className="vm-village-card__metrics">
                  <div className="vm-village-card__metric-item">
                    <span className="vm-village-card__metric-label">Nodes</span>
                    <span className="vm-village-card__metric-value">{v.nodes_count || 0}</span>
                  </div>
                  <div className="vm-village-card__metric-item">
                    <span className="vm-village-card__metric-label">Lifelines</span>
                    <span className="vm-village-card__metric-value">{v.edges_count || 0}</span>
                  </div>
                  <div className="vm-village-card__metric-item">
                    <span className="vm-village-card__metric-label">Facilities</span>
                    <span className="vm-village-card__metric-value">{v.facilities_count || 0}</span>
                  </div>
                </div>

                {/* Footer with date and Open button */}
                <div className="vm-village-card__footer">
                  <span className="vm-village-card__date">
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    Updated: {updatedDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenVillage(v)}
                    className="vm-village-card__open-btn"
                  >
                    {isDraft ? 'Resume Draft' : 'Open Village'} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Administrative Review Duplicates Modal */}
      {showDuplicatesModal && (
        <ReviewDuplicatesModal
          isOpen={showDuplicatesModal}
          onClose={() => setShowDuplicatesModal(false)}
          onConsolidationComplete={() => {
            setShowDuplicatesModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
