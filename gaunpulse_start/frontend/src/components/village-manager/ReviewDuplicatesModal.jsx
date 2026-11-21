import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function ReviewDuplicatesModal({ isOpen, onClose, onConsolidationComplete }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Load read-only duplicate audit
  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/villages/duplicate-audit`);
      if (!res.ok) throw new Error('Failed to retrieve duplicate audit report.');
      const data = await res.json();
      setAudit(data);
      if (data.duplicate_groups?.length > 0) {
        setSelectedGroup(data.duplicate_groups[0]);
        // Auto-fetch preview for first group
        fetchPreview(data.duplicate_groups[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAudit();
    }
  }, [isOpen]);

  // Fetch Preview
  const fetchPreview = async (group) => {
    try {
      const res = await fetch(`${API_BASE}/villages/preview-consolidation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonical_id: group.canonical_id,
          duplicate_ids: group.duplicate_ids,
        }),
      });
      if (res.ok) {
        const pData = await res.json();
        setPreview(pData);
      }
    } catch (err) {
      console.error('Error fetching consolidation preview:', err);
    }
  };

  // Execute Consolidation (Requires explicit checkbox)
  const handleConsolidate = async () => {
    if (!selectedGroup || !confirmCheckbox || executing) return;
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/villages/consolidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonical_id: selectedGroup.canonical_id,
          duplicate_ids: selectedGroup.duplicate_ids,
          confirmed: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Consolidation failed.');
      }

      const resData = await res.json();
      setResult(resData);
      setConfirmCheckbox(false);
      await loadAudit();
      if (onConsolidationComplete) {
        onConsolidationComplete();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(18, 61, 48, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(18, 61, 48, 0.16)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #dfe6df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fffbeb',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#092d22', fontWeight: 800 }}>
                Duplicate Village Records Audit
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#687c73' }}>
                Review duplicate registration groups and safely consolidate relations into canonical records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#687c73' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#eaf8ef', border: '1px solid #b8dfc2', color: '#176342', fontSize: '13.5px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>{result.message}</strong>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Canonical Village ID: <strong>{result.canonical_village_id}</strong> · Reassigned Simulations: <strong>{result.reassigned_simulations}</strong> · Pruned duplicate nodes: <strong>{result.pruned_duplicate_nodes}</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Audit Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>TOTAL VILLAGES</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#092d22' }}>
                {loading ? '...' : audit?.total_villages || 0}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>GENUINE VILLAGES</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#176342' }}>
                {loading ? '...' : audit?.distinct_villages_count || 0}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>DUPLICATE GROUPS</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#b45309' }}>
                {loading ? '...' : audit?.duplicate_groups_count || 0}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #e7ebe7' }}>
              <span style={{ fontSize: '11px', color: '#687c73', fontWeight: 600 }}>REDUNDANT COPIES</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                {loading ? '...' : audit?.duplicate_records_count || 0}
              </div>
            </div>
          </div>

          {audit?.duplicate_groups?.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ margin: 0, fontSize: '16px', color: '#092d22', fontWeight: 800 }}>
                No Duplicate Village Records Found
              </h4>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#166534' }}>
                Every registered village in MySQL represents a unique administrative jurisdiction in Nepal.
              </p>
            </div>
          ) : (
            selectedGroup && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Group Identification Banner */}
                <div style={{ padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                        Duplicate Group Detected
                      </span>
                      <h4 style={{ margin: '2px 0 0', fontSize: '16px', color: '#092d22', fontWeight: 800 }}>
                        {selectedGroup.display_name}
                      </h4>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', background: '#ffffff', padding: '4px 10px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                      {selectedGroup.total_copies} Identical Records
                    </span>
                  </div>
                </div>

                {/* Canonical vs Duplicate Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Canonical Candidate */}
                  <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      <ShieldCheck size={16} /> Selected Canonical Record
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#092d22' }}>
                      Village ID #{selectedGroup.canonical.id}: {selectedGroup.canonical.name}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#495a52', marginTop: '4px', lineHeight: 1.45 }}>
                      • Reliability Score: <strong>{selectedGroup.canonical.reliability_score}</strong> (Highest)<br />
                      • Mapped Issues: <strong>{selectedGroup.canonical.issues_count}</strong><br />
                      • Simulations: <strong>{selectedGroup.canonical.simulations_count}</strong><br />
                      • Nodes: <strong>{selectedGroup.canonical.nodes_count}</strong> · Lifelines: <strong>{selectedGroup.canonical.edges_count}</strong><br />
                      • Created: {selectedGroup.canonical.created_at?.slice(0, 10)}
                    </div>
                  </div>

                  {/* Redundant Duplicates List */}
                  <div style={{ padding: '16px', background: '#f8faf8', border: '1px solid #e7ebe7', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      <Trash2 size={16} /> Redundant Copies ({selectedGroup.duplicates.length})
                    </div>
                    <div style={{ fontSize: '12px', color: '#687c73', maxHeight: '110px', overflowY: 'auto' }}>
                      {selectedGroup.duplicates.map((d) => (
                        <div key={d.id} style={{ padding: '3px 0', borderBottom: '1px solid #f0f2f0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>ID #{d.id} ({d.created_at?.slice(11, 19)})</span>
                          <span>Sims: {d.simulations_count} · Issues: {d.issues_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Proposed Consolidation Preview */}
                {preview && (
                  <div style={{ background: '#ffffff', border: '1px solid #dfe6df', borderRadius: '12px', padding: '16px' }}>
                    <h5 style={{ margin: '0 0 10px', fontSize: '14px', color: '#092d22', fontWeight: 750 }}>
                      Proposed Transactional Consolidation Actions:
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#495a52', lineHeight: 1.5 }}>
                      <li>
                        <strong>Reassign Civic Records:</strong> {preview.reassignments.simulations} simulation history records will be safely reassigned to Canonical Village ID #{preview.canonical_village.id}.
                      </li>
                      <li>
                        <strong>Preserve Infrastructure:</strong> Canonical village's {preview.canonical_village.current_nodes} nodes and {preview.canonical_village.current_edges} lifelines are 100% preserved.
                      </li>
                      <li>
                        <strong>Prune Redundant Data:</strong> {preview.redundant_records_to_prune.duplicate_nodes} cloned nodes, {preview.redundant_records_to_prune.duplicate_edges} cloned edges, and {preview.redundant_records_to_prune.duplicate_villages} duplicate village rows will be safely removed.
                      </li>
                      <li>
                        <strong>Atomic Transaction:</strong> Database rollback guaranteed if any relational integrity check fails.
                      </li>
                    </ul>
                  </div>
                )}

                {/* Explicit Human Approval Gate */}
                <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={confirmCheckbox}
                      onChange={(e) => setConfirmCheckbox(e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <span style={{ fontSize: '12.5px', color: '#991b1b', lineHeight: 1.45 }}>
                      <strong>Explicit Authorization Required:</strong> I have reviewed the duplicate audit report and confirm that these {selectedGroup.duplicates.length} records are confirmed duplicates. I authorize transactional consolidation into canonical Village ID #{selectedGroup.canonical.id}.
                    </span>
                  </label>
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #dfe6df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <button type="button" onClick={onClose} className="button button--secondary">
            Close
          </button>

          {audit?.duplicate_groups?.length > 0 && (
            <button
              type="button"
              onClick={handleConsolidate}
              disabled={!confirmCheckbox || executing}
              className="button button--primary"
              style={{
                background: confirmCheckbox ? '#b91c1c' : '#9ca3af',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: confirmCheckbox ? 'pointer' : 'not-allowed',
              }}
            >
              {executing ? (
                <>
                  <Loader2 size={16} className="spin" /> Executing Transactional Consolidation...
                </>
              ) : (
                <>
                  <ShieldAlert size={16} /> Execute Transactional Consolidation
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
