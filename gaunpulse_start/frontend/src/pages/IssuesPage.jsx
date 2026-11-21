import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Card, CardHeader, FeatureNotice, LiveLabel, PageIntro, StatusBadge } from '../components/ui';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';

const CATEGORIES = [
  { value: 'damaged_bridge', label: 'Damaged Bridge' },
  { value: 'damaged_road', label: 'Damaged Road' },
  { value: 'water_supply', label: 'Drinking Water Supply' },
  { value: 'school_access', label: 'School Access Trail' },
  { value: 'health_post_access', label: 'Health Post Access' },
  { value: 'other_infrastructure', label: 'Other Infrastructure' },
];

const SEVERITIES = [
  { value: 'critical', label: 'Critical (Life-Safety Disruption)', tone: 'red' },
  { value: 'high', label: 'High (Major Detour / Risk)', tone: 'orange' },
  { value: 'medium', label: 'Medium (Limited Access)', tone: 'green' },
  { value: 'low', label: 'Low (Minor Deterioration)', tone: 'default' },
];

const severityTones = {
  critical: 'red',
  high: 'orange',
  medium: 'green',
  low: 'default',
  Critical: 'red',
  High: 'orange',
  Medium: 'green',
  Low: 'default',
};

const statusTones = {
  submitted: 'orange',
  under_review: 'orange',
  verified: 'mint',
  in_progress: 'green',
  resolved: 'green',
  rejected: 'red',
};

export default function IssuesPage({ onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [villages, setVillages] = useState([]);
  const [villageEdges, setVillageEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    village_id: '',
    edge_id: '',
    title: '',
    category: 'damaged_bridge',
    severity: 'critical',
    description: '',
    latitude: 27.8635,
    longitude: 85.5815,
  });
  const [photoFile, setPhotoFile] = useState(null);

  // Load issues and villages
  const loadData = async () => {
    setLoading(true);
    try {
      const [resIssues, resVillages] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/issues'),
        fetch('http://127.0.0.1:8000/api/villages'),
      ]);
      const dataIssues = await resIssues.json();
      const dataVillages = await resVillages.json();

      setIssues(dataIssues.data || dataIssues || []);
      setVillages(dataVillages || []);

      if (dataVillages.length > 0 && !formData.village_id) {
        setFormData((prev) => ({
          ...prev,
          village_id: dataVillages[0].id,
          latitude: dataVillages[0].center_lat || 27.8635,
          longitude: dataVillages[0].center_lng || 85.5815,
        }));
      }
    } catch (err) {
      console.error('Failed to load issues or villages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When village changes in modal, load its edges
  useEffect(() => {
    if (!formData.village_id) return;
    fetch(`http://127.0.0.1:8000/api/villages/${formData.village_id}/network`)
      .then((res) => res.json())
      .then((data) => {
        setVillageEdges(data.edges || []);
      })
      .catch(() => setVillageEdges([]));
  }, [formData.village_id]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const postData = new FormData();
      postData.append('village_id', formData.village_id);
      if (formData.edge_id) postData.append('edge_id', formData.edge_id);
      postData.append('title', formData.title);
      postData.append('category', formData.category);
      postData.append('severity', formData.severity);
      postData.append('description', formData.description);
      postData.append('latitude', formData.latitude);
      postData.append('longitude', formData.longitude);
      if (photoFile) postData.append('photo', photoFile);

      const res = await fetch('http://127.0.0.1:8000/api/issues', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: postData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Validation error saving issue.');
      }

      setSubmitSuccess(`Report successfully filed and persisted to MySQL database! Tracking code: ${json.data?.tracking_code || 'GP-REC'}`);
      // Reset form
      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
        edge_id: '',
      }));
      setPhotoFile(null);
      // Refresh list
      loadData();
      setTimeout(() => setShowCreateModal(false), 1800);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async () => {
    if (!selectedIssue || !newStatus) return;
    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment || `Status updated to ${newStatus}`,
        }),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.message || 'Failed to update status.');
      }

      setStatusMessage('Status updated successfully and logged in database.');
      setSelectedIssue(updated.data || updated);
      loadData();
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter issues with case and format normalization
  const norm = (s) => (s || '').toLowerCase().replace(/[\s-]+/g, '_');

  const getSeverityTone = (sev) => severityTones[(sev || '').toLowerCase()] || severityTones[sev] || 'default';
  const getStatusTone = (st) => statusTones[(st || '').toLowerCase().replace(/[\s-]+/g, '_')] || statusTones[st] || 'default';

  const filteredIssues = issues.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.tracking_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.village?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || norm(item.category) === norm(filterCategory);
    const matchesSeverity = !filterSeverity || norm(item.severity) === norm(filterSeverity);
    const matchesStatus = !filterStatus || norm(item.status) === norm(filterStatus);
    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Civic & Municipal Triage"
        title="Issues & Alerts"
        description="Review, verify, and resolve rural infrastructure disruptions recorded in the municipal database. Persists directly to MySQL and calculates priority weights."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button button--secondary" type="button" onClick={loadData}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                setSubmitSuccess(null);
                setSubmitError(null);
                setShowCreateModal(true);
              }}
            >
              <Plus size={16} /> Report New Issue
            </button>
          </div>
        }
      />

      <FeatureNotice title="Connected to MySQL Infrastructure Database" icon={ShieldCheck}>
        Showing active records from the municipal database. Newly submitted reports are stored in the <code>issues</code> table and persist across sessions.
      </FeatureNotice>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: '#f6f5ed', borderRadius: '8px', padding: '0 10px' }}>
            <Search size={16} color="#687c73" />
            <input
              type="text"
              placeholder="Search by title, village, or tracking code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '9px 10px', width: '100%', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #dfe6df', background: '#fff', fontSize: '12.5px' }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #dfe6df', background: '#fff', fontSize: '12.5px' }}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #dfe6df', background: '#fff', fontSize: '12.5px' }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader
          eyebrow="Triage queue"
          title={`Registered Infrastructure Issues (${filteredIssues.length})`}
          description="Click any issue row to view complete details, history timeline, and update municipal verification status."
          action={<LiveLabel text="Live Triage Queue" compact />}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#687c73' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
            Loading infrastructure issues from database...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#687c73' }}>
            <AlertTriangle size={32} color="#e98535" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontWeight: 'bold' }}>No issues found matching current criteria.</p>
            <small>Try clearing filters or click "Report New Issue" to file a report.</small>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Issue & Code</th>
                  <th>Village / Location</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedIssue(item);
                      setNewStatus(item.status);
                      setStatusComment('');
                      setStatusMessage(null);
                    }}
                  >
                    <td>
                      <strong>{item.title}</strong>
                      <small style={{ display: 'block', color: '#687c73' }}>
                        {item.tracking_code || `GP-ISSUE-${item.id}`} {item.edge ? `· Linked to ${item.edge.name}` : ''}
                      </small>
                    </td>
                    <td>
                      <strong>{item.village?.name || 'Municipal Area'}</strong>
                      <small style={{ display: 'block', color: '#687c73' }}>
                        {item.village?.municipality || 'Helambu'}
                      </small>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        {(item.category || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <StatusBadge tone={getSeverityTone(item.severity)}>
                        {item.severity}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge tone={getStatusTone(item.status)}>
                        {(item.status || '').replace(/_/g, ' ')}
                      </StatusBadge>
                    </td>
                    <td>
                      <button
                        className="button button--secondary"
                        type="button"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(item);
                          setNewStatus(item.status);
                          setStatusComment('');
                          setStatusMessage(null);
                        }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE ISSUE MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 45, 34, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #dfe6df',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #dfe6df', paddingBottom: '12px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#176342' }}>Citizen & Field Reporting</span>
                <h2 style={{ margin: '2px 0 0', color: '#092d22', fontSize: '18px' }}>Report New Infrastructure Issue</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#687c73' }}
              >
                <X size={20} />
              </button>
            </div>

            {submitSuccess && (
              <div style={{ padding: '12px 16px', background: '#e4f4e9', border: '1px solid #248157', borderRadius: '8px', color: '#124b35', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle2 size={18} color="#176342" />
                {submitSuccess}
              </div>
            )}

            {submitError && (
              <div style={{ padding: '12px 16px', background: '#fde9e5', border: '1px solid #c94b46', borderRadius: '8px', color: '#c94b46', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={18} color="#c94b46" />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="create-village" style={{ fontWeight: 'bold' }}>Village *</label>
                  <select
                    id="create-village"
                    required
                    value={formData.village_id}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const sel = villages.find((v) => String(v.id) === String(vId));
                      setFormData((prev) => ({
                        ...prev,
                        village_id: vId,
                        latitude: sel?.center_lat || prev.latitude,
                        longitude: sel?.center_lng || prev.longitude,
                      }));
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {deduplicateVillages(villages).map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatVillageLabel(v)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="create-category" style={{ fontWeight: 'bold' }}>Issue Category *</label>
                  <select
                    id="create-category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="create-edge" style={{ fontWeight: 'bold' }}>Linked Infrastructure Asset (Optional)</label>
                <select
                  id="create-edge"
                  value={formData.edge_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, edge_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                >
                  <option value="">-- No specific road or bridge linked --</option>
                  {villageEdges.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.infrastructure_type || e.type || 'road'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="create-title" style={{ fontWeight: 'bold' }}>Issue Title *</label>
                <input
                  id="create-title"
                  type="text"
                  required
                  placeholder="e.g. Bridge B main support cable sheared by flood torrent"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div>
                <label htmlFor="create-description" style={{ fontWeight: 'bold' }}>Description & Community Impact *</label>
                <textarea
                  id="create-description"
                  required
                  rows={3}
                  placeholder="Describe observed damage, impassable sections, and which settlements or facilities are cut off (min 15 characters)..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="create-severity" style={{ fontWeight: 'bold' }}>Severity *</label>
                  <select
                    id="create-severity"
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, severity: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="create-lat" style={{ fontWeight: 'bold' }}>Latitude *</label>
                  <input
                    id="create-lat"
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>

                <div>
                  <label htmlFor="create-lng" style={{ fontWeight: 'bold' }}>Longitude *</label>
                  <input
                    id="create-lng"
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #dfe6df' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-photo" style={{ fontWeight: 'bold' }}>Attach Photo / Evidence (Optional)</label>
                <input
                  id="create-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setPhotoFile(e.target.files[0] || null)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting to MySQL...
                    </>
                  ) : (
                    'Submit Report to Municipality'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE DETAIL & STATUS MODAL */}
      {selectedIssue && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(9, 45, 34, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #dfe6df',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #dfe6df', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <StatusBadge tone={severityTones[selectedIssue.severity]}>{selectedIssue.severity}</StatusBadge>
                  <StatusBadge tone={statusTones[selectedIssue.status]}>{selectedIssue.status}</StatusBadge>
                  <span style={{ fontSize: '11px', color: '#687c73' }}>{selectedIssue.tracking_code || `GP-${selectedIssue.id}`}</span>
                </div>
                <h2 style={{ margin: 0, color: '#092d22', fontSize: '18px' }}>{selectedIssue.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#687c73' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', fontSize: '13px', color: '#19392f' }}>
              <div style={{ padding: '12px', background: '#f8faf8', borderRadius: '8px', border: '1px solid #dfe6df' }}>
                <p style={{ margin: '0 0 6px', lineHeight: '1.5' }}>{selectedIssue.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11.5px', color: '#687c73', marginTop: '10px' }}>
                  <span><strong>Village:</strong> {selectedIssue.village?.name || 'Demo Area'}</span>
                  {selectedIssue.edge && <span><strong>Asset:</strong> {selectedIssue.edge.name}</span>}
                  <span><strong>Coordinates:</strong> {selectedIssue.latitude}, {selectedIssue.longitude}</span>
                  {selectedIssue.reporter_name && <span><strong>Reporter:</strong> {selectedIssue.reporter_name} ({selectedIssue.reporter_phone || 'Verified'})</span>}
                </div>
              </div>

              {/* Status Update Action Box */}
              <div style={{ padding: '16px', background: '#f1f8f2', borderRadius: '10px', border: '1.5px solid #248157' }}>
                <h4 style={{ margin: '0 0 8px', color: '#092d22', fontSize: '14px' }}>Update Issue Status & Action History</h4>
                {statusMessage && (
                  <div style={{ padding: '8px 12px', background: '#e4f4e9', borderRadius: '6px', fontSize: '12px', color: '#124b35', marginBottom: '10px' }}>
                    {statusMessage}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', marginBottom: '4px' }}>New Status:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #dfe6df', background: '#fff', fontSize: '12.5px' }}
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="verified">Verified (Confirmed on site)</option>
                      <option value="in_progress">In Progress (Work underway)</option>
                      <option value="resolved">Resolved (Repairs completed)</option>
                      <option value="rejected">Rejected (Not actionable)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', marginBottom: '4px' }}>Log Comment / Notes:</label>
                    <input
                      type="text"
                      placeholder="e.g. Inspection conducted by municipal technical officer"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #dfe6df', fontSize: '12.5px' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    style={{ height: '36px', fontSize: '12px' }}
                  >
                    {updatingStatus ? <Loader2 className="animate-spin" size={14} /> : 'Save Update'}
                  </button>
                </div>
              </div>

              {/* Status Update History */}
              {selectedIssue.updates && selectedIssue.updates.length > 0 && (
                <div>
                  <h4 style={{ margin: '8px 0 6px', color: '#092d22', fontSize: '13px' }}>Audit & Update Trail</h4>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {selectedIssue.updates.map((upd, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: '#faf9f5', border: '1px solid #dfe6df', borderRadius: '6px', fontSize: '11.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#687c73' }}>
                          <span><strong>{upd.old_status} → {upd.new_status}</strong></span>
                          <span>{new Date(upd.created_at).toLocaleString()}</span>
                        </div>
                        {upd.comment && <p style={{ margin: '3px 0 0', color: '#19392f' }}>{upd.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
