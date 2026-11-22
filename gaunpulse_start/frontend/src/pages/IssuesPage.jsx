import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Image as ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Card, CardHeader, EmptyState, FeatureNotice, LiveLabel, PageIntro, StatusBadge } from '../components/ui';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { cachedFetchJson, invalidateApiCache } from '../utils/apiCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  const { selectedVillageId, villages: contextVillages } = useVillageSelection();
  const [issues, setIssues] = useState([]);
  const [villages, setVillages] = useState(contextVillages || []);
  const [villageEdges, setVillageEdges] = useState([]);
  const [loadingEdges, setLoadingEdges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sync villages from context
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
    }
  }, [contextVillages]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

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
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load issues and villages
  const loadData = async (force = false) => {
    if (issues.length === 0) setLoading(true);
    try {
      const [dataIssues, dataVillages] = await Promise.all([
        cachedFetchJson(`${API_BASE_URL}/api/issues`, {}, {
          force,
          ttlMs: 45000,
          onBackgroundUpdate: (fresh) => {
            if (fresh) setIssues(fresh.data || fresh || []);
          },
        }),
        contextVillages && contextVillages.length > 0
          ? Promise.resolve(contextVillages)
          : cachedFetchJson(`${API_BASE_URL}/api/villages`, {}, { ttlMs: 120000 }),
      ]);

      const issueList = dataIssues.data || dataIssues || [];
      const villageList = Array.isArray(dataVillages) ? dataVillages : [];

      setIssues(issueList);
      setVillages(villageList);

      // Default to globally selected village if available, or first village
      if (villageList.length > 0 && !formData.village_id) {
        const preferredId = selectedVillageId && villageList.some((v) => Number(v.id) === Number(selectedVillageId))
          ? Number(selectedVillageId)
          : villageList[0].id;

        const matched = villageList.find((v) => Number(v.id) === Number(preferredId)) || villageList[0];
        setFormData((prev) => ({
          ...prev,
          village_id: String(matched.id),
          latitude: matched.center_lat ? parseFloat(matched.center_lat) : 27.8635,
          longitude: matched.center_lng ? parseFloat(matched.center_lng) : 85.5815,
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

  // When village changes in modal, load its edges & reset invalid edge
  useEffect(() => {
    if (!formData.village_id) {
      setVillageEdges([]);
      return;
    }
    setLoadingEdges(true);
    fetch(`${API_BASE_URL}/api/villages/${formData.village_id}/network`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load network edges');
        return res.json();
      })
      .then((data) => {
        const edges = data.edges || [];
        setVillageEdges(edges);
        // If current edge_id does not belong to newly loaded edges, reset it
        setFormData((prev) => {
          if (prev.edge_id && !edges.some((e) => String(e.id) === String(prev.edge_id))) {
            return { ...prev, edge_id: '' };
          }
          return prev;
        });
      })
      .catch((err) => {
        console.warn('Could not load village edges:', err);
        setVillageEdges([]);
      })
      .finally(() => {
        setLoadingEdges(false);
      });
  }, [formData.village_id]);

  // Photo selection with preview and size validation
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // Client-side file size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, photo: 'Photo size exceeds the 5MB limit. Please choose a smaller image.' }));
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // Check allowed image MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, photo: 'Invalid image format. Allowed formats: JPEG, PNG, WebP.' }));
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Form Submit with Robust Error Classification & Form Data Preservation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setFieldErrors({});

    // Client-side validations
    const errors = {};
    if (!formData.village_id) {
      errors.village_id = 'Please select a village.';
    }
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long.';
    }
    if (!formData.description || formData.description.trim().length < 15) {
      errors.description = 'Description must be at least 15 characters long.';
    }
    if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
    if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please check the highlighted fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const postData = new FormData();
      postData.append('village_id', formData.village_id);
      if (formData.edge_id) postData.append('edge_id', formData.edge_id);
      postData.append('title', formData.title.trim());
      postData.append('category', formData.category);
      postData.append('severity', formData.severity);
      postData.append('description', formData.description.trim());
      postData.append('latitude', formData.latitude);
      postData.append('longitude', formData.longitude);
      if (photoFile) postData.append('photo', photoFile);

      let res;
      try {
        res = await fetch(`${API_BASE_URL}/api/issues`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: postData,
        });
      } catch (fetchErr) {
        // Network connection error / server offline
        console.error('Network fetch error contacting Laravel:', fetchErr);
        throw new Error('NETWORK_UNAVAILABLE');
      }

      let json = {};
      try {
        json = await res.json();
      } catch (jsonErr) {
        console.warn('Response was not valid JSON:', jsonErr);
      }

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('AUTH_EXPIRED');
        } else if (res.status === 403) {
          throw new Error('PERMISSION_DENIED');
        } else if (res.status === 413) {
          throw new Error('UPLOAD_TOO_LARGE');
        } else if (res.status === 422) {
          // Validation errors from Laravel
          const serverErrors = {};
          if (json.errors) {
            Object.keys(json.errors).forEach((key) => {
              serverErrors[key] = json.errors[key][0];
            });
          }
          setFieldErrors(serverErrors);
          throw new Error('VALIDATION_ERROR');
        } else if (res.status >= 500) {
          throw new Error('SERVER_ERROR');
        } else {
          throw new Error(json.message || `HTTP_ERROR_${res.status}`);
        }
      }

      // Success
      const trackingCode = json.data?.tracking_code || 'GP-REC';
      setSubmitSuccess(`Report successfully filed and persisted to MySQL database! Tracking code: ${trackingCode}`);

      // Invalidate caches & refresh list immediately
      invalidateApiCache('api/issues');
      invalidateApiCache('api/dashboard');
      invalidateApiCache('api/reports');
      loadData(true);

      // Reset form fields only on confirmed success
      setTimeout(() => {
        setFormData({
          village_id: formData.village_id,
          edge_id: '',
          title: '',
          category: 'damaged_bridge',
          severity: 'critical',
          description: '',
          latitude: formData.latitude,
          longitude: formData.longitude,
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowCreateModal(false);
      }, 1600);
    } catch (err) {
      console.error('Issue submission error:', err);
      // Map error codes to friendly explanations per Step 4
      if (err.message === 'NETWORK_UNAVAILABLE') {
        setSubmitError('Unable to connect to the GaunPulse server. Please check your connection and try again.');
      } else if (err.message === 'AUTH_EXPIRED') {
        setSubmitError('Your session has expired. Please sign in again.');
      } else if (err.message === 'PERMISSION_DENIED') {
        setSubmitError("You don't have permission to submit a report for this village.");
      } else if (err.message === 'UPLOAD_TOO_LARGE') {
        setSubmitError('The photo could not be uploaded because it exceeds the 5MB size limit. Please choose a smaller photo and try again.');
      } else if (err.message === 'VALIDATION_ERROR') {
        setSubmitError('Please check the highlighted fields.');
      } else if (err.message === 'SERVER_ERROR') {
        setSubmitError('Your report could not be saved. Please try again.');
      } else {
        setSubmitError(err.message || 'An unexpected error occurred while saving the report.');
      }
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
      const res = await fetch(`${API_BASE_URL}/api/issues/${selectedIssue.id}/status`, {
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
      invalidateApiCache('api/issues');
      invalidateApiCache('api/dashboard');
      invalidateApiCache('api/reports');
      loadData(true);
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

  const dedupedVillages = deduplicateVillages(villages);

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Civic & Municipal Triage"
        title="Issues & Alerts"
        description="Review, verify, and resolve rural infrastructure disruptions recorded in the municipal database. Persists directly to MySQL and calculates priority weights."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button button--secondary" type="button" onClick={() => loadData(true)}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                setSubmitSuccess(null);
                setSubmitError(null);
                setFieldErrors({});
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
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', padding: '0 12px', border: '1px solid var(--border)' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by title, village, or tracking code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '9px 10px', width: '100%', fontSize: '13px', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12.5px', color: 'var(--text-primary)' }}
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
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12.5px', color: 'var(--text-primary)' }}
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
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12.5px', color: 'var(--text-primary)' }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
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
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
            Loading infrastructure issues from database...
          </div>
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No issues found matching current criteria"
            description="Try clearing search filters or report a new issue to log municipal records."
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setSearch('');
                  setFilterCategory('');
                  setFilterSeverity('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </button>
            }
          />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.photo_url && (
                          <span title="Has photo attachment" style={{ color: '#176342', display: 'inline-flex' }}>
                            <Camera size={13} />
                          </span>
                        )}
                        <strong>{item.title}</strong>
                      </div>
                      <small style={{ display: 'block', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {item.tracking_code || `GP-ISSUE-${item.id}`} {item.edge ? `· Linked to ${item.edge.name}` : ''}
                      </small>
                    </td>
                    <td>
                      <strong>{item.village?.name || 'Municipal Area'}</strong>
                      <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
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
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !isSubmitting && setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Citizen & Field Reporting</span>
                <h2>Report New Infrastructure Issue</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setShowCreateModal(false)}
                aria-label="Close"
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {submitSuccess && (
              <div style={{ padding: '12px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '12.5px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle2 size={16} />
                {submitSuccess}
              </div>
            )}

            {submitError && (
              <div style={{ padding: '12px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(198,79,69,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '12.5px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Village Selector */}
                <div>
                  <label htmlFor="create-village" style={{ fontWeight: 600 }}>Village *</label>
                  <select
                    id="create-village"
                    required
                    value={formData.village_id}
                    style={{ borderColor: fieldErrors.village_id ? 'var(--danger)' : undefined }}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const sel = villages.find((v) => String(v.id) === String(vId));
                      // CRITICAL: Changing villages clears edge_id to prevent cross-village ownership bugs
                      setFormData((prev) => ({
                        ...prev,
                        village_id: vId,
                        edge_id: '',
                        latitude: sel?.center_lat ? parseFloat(sel.center_lat) : prev.latitude,
                        longitude: sel?.center_lng ? parseFloat(sel.center_lng) : prev.longitude,
                      }));
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.village_id;
                        delete copy.edge_id;
                        return copy;
                      });
                    }}
                  >
                    <option value="" disabled>-- Select Village --</option>
                    {dedupedVillages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatVillageLabel(v)}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.village_id && (
                    <small style={{ color: 'var(--danger)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      {fieldErrors.village_id}
                    </small>
                  )}
                </div>

                {/* Issue Category */}
                <div>
                  <label htmlFor="create-category" style={{ fontWeight: 600 }}>Issue Category *</label>
                  <select
                    id="create-category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Infrastructure Asset */}
              <div>
                <label htmlFor="create-edge" style={{ fontWeight: 600 }}>
                  Linked Infrastructure Asset (Optional)
                  {loadingEdges && <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6 }}>loading village assets...</span>}
                </label>
                <select
                  id="create-edge"
                  value={formData.edge_id}
                  style={{ borderColor: fieldErrors.edge_id ? 'var(--danger)' : undefined }}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, edge_id: e.target.value }));
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.edge_id;
                      return copy;
                    });
                  }}
                >
                  <option value="">-- No specific road or bridge linked --</option>
                  {villageEdges.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.infrastructure_type || e.type || 'road'})
                    </option>
                  ))}
                </select>
                {fieldErrors.edge_id && (
                  <small style={{ color: 'var(--danger)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    {fieldErrors.edge_id}
                  </small>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="create-title" style={{ fontWeight: 600 }}>Issue Title *</label>
                <input
                  id="create-title"
                  type="text"
                  required
                  placeholder="e.g. Bridge main support cable sheared by flood torrent"
                  value={formData.title}
                  style={{ borderColor: fieldErrors.title ? 'var(--danger)' : undefined }}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.title;
                        return copy;
                      });
                    }
                  }}
                />
                {fieldErrors.title && (
                  <small style={{ color: 'var(--danger)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    {fieldErrors.title}
                  </small>
                )}
              </div>

              {/* Description & Impact */}
              <div>
                <label htmlFor="create-description" style={{ fontWeight: 600 }}>
                  Description & Community Impact * (min 15 characters)
                </label>
                <textarea
                  id="create-description"
                  required
                  rows={3}
                  placeholder="Describe observed damage, impassable sections, and which settlements or facilities are cut off..."
                  value={formData.description}
                  style={{ borderColor: fieldErrors.description ? 'var(--danger)' : undefined }}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, description: e.target.value }));
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.description;
                        return copy;
                      });
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  {fieldErrors.description ? (
                    <small style={{ color: 'var(--danger)', fontSize: '11px' }}>
                      {fieldErrors.description}
                    </small>
                  ) : <span />}
                  <small style={{ color: formData.description.length < 15 ? 'var(--text-secondary)' : 'var(--success)', fontSize: '11px' }}>
                    {formData.description.length} / 15 chars min
                  </small>
                </div>
              </div>

              {/* Severity & Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="create-severity" style={{ fontWeight: 600 }}>Severity *</label>
                  <select
                    id="create-severity"
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, severity: e.target.value }))}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="create-lat" style={{ fontWeight: 600 }}>Latitude *</label>
                  <input
                    id="create-lat"
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    style={{ borderColor: fieldErrors.latitude ? 'var(--danger)' : undefined }}
                    onChange={(e) => setFormData((prev) => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  />
                  {fieldErrors.latitude && (
                    <small style={{ color: 'var(--danger)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      {fieldErrors.latitude}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="create-lng" style={{ fontWeight: 600 }}>Longitude *</label>
                  <input
                    id="create-lng"
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    style={{ borderColor: fieldErrors.longitude ? 'var(--danger)' : undefined }}
                    onChange={(e) => setFormData((prev) => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  />
                  {fieldErrors.longitude && (
                    <small style={{ color: 'var(--danger)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      {fieldErrors.longitude}
                    </small>
                  )}
                </div>
              </div>

              {/* Photo Upload with Preview */}
              <div>
                <label htmlFor="create-photo" style={{ fontWeight: 600 }}>Attach Photo / Evidence (Optional, max 5MB)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input
                    id="create-photo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                  />
                  {photoFile && (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={handleRemovePhoto}
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {fieldErrors.photo && (
                  <small style={{ color: 'var(--danger)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {fieldErrors.photo}
                  </small>
                )}
                {photoPreview && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={photoPreview}
                      alt="Upload preview"
                      style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {photoFile?.name} ({Math.round(photoFile.size / 1024)} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
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
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setSelectedIssue(null)}>
          <div className="modal-card modal-card--lg" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <StatusBadge tone={severityTones[selectedIssue.severity]}>{selectedIssue.severity}</StatusBadge>
                  <StatusBadge tone={statusTones[selectedIssue.status]}>{selectedIssue.status}</StatusBadge>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {selectedIssue.tracking_code || `GP-${selectedIssue.id}`}
                  </span>
                </div>
                <h2>{selectedIssue.title}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedIssue(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <div style={{ padding: '14px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 8px', lineHeight: '1.5' }}>{selectedIssue.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <span><strong>Village:</strong> {selectedIssue.village?.name || 'Municipal Area'}</span>
                  {selectedIssue.edge && <span><strong>Asset:</strong> {selectedIssue.edge.name}</span>}
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}><strong>Coordinates:</strong> {selectedIssue.latitude}, {selectedIssue.longitude}</span>
                  {selectedIssue.reporter_name && <span><strong>Reporter:</strong> {selectedIssue.reporter_name} ({selectedIssue.reporter_phone || 'Verified'})</span>}
                </div>

                {/* Display Photo Evidence if available */}
                {selectedIssue.photo_url && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Attached Photographic Evidence:
                    </strong>
                    <a href={selectedIssue.photo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                      <img
                        src={selectedIssue.photo_url}
                        alt={selectedIssue.title}
                        style={{
                          maxHeight: '200px',
                          maxWidth: '100%',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          objectFit: 'cover',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                        }}
                      />
                    </a>
                  </div>
                )}
              </div>

              {/* Status Update Action Box */}
              <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '13.5px', fontWeight: 600 }}>Update Issue Status & Action History</h4>
                {statusMessage && (
                  <div style={{ padding: '8px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--success)', marginBottom: '10px' }}>
                    {statusMessage}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>New Status:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', fontSize: '12.5px' }}
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
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Log Comment / Notes:</label>
                    <input
                      type="text"
                      placeholder="e.g. Inspection conducted by municipal technical officer"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '12.5px' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    style={{ height: '35px', fontSize: '12px' }}
                  >
                    {updatingStatus ? <Loader2 className="animate-spin" size={14} /> : 'Save Update'}
                  </button>
                </div>
              </div>

              {/* Status Update History */}
              {selectedIssue.updates && selectedIssue.updates.length > 0 && (
                <div>
                  <h4 style={{ margin: '8px 0 6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Audit & Update Trail</h4>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {selectedIssue.updates.map((upd, i) => (
                      <div key={i} style={{ padding: '9px 12px', background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '11.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span><strong>{upd.old_status} → {upd.new_status}</strong></span>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{new Date(upd.created_at).toLocaleString()}</span>
                        </div>
                        {upd.comment && <p style={{ margin: '3px 0 0', color: 'var(--text-primary)' }}>{upd.comment}</p>}
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
