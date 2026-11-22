import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  Layers,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, EmptyState, FeatureNotice, LiveLabel, PageIntro, StatusBadge } from '../components/ui';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { useAuth } from '../context/AuthContext';
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
  pending_verification: 'orange',
  under_review: 'orange',
  more_information_needed: 'orange',
  verified: 'mint',
  in_progress: 'green',
  resolved: 'green',
  rejected: 'red',
};

export default function IssuesPage({ onNavigate }) {
  const { token, user: authUser } = useAuth();
  const { selectedVillageId, villages: contextVillages } = useVillageSelection();
  const [issues, setIssues] = useState([]);
  const [villages, setVillages] = useState(contextVillages || []);
  const [villageEdges, setVillageEdges] = useState([]);
  const [loadingEdges, setLoadingEdges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending_verification'
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

  // Handle Status Update & Verification Actions
  const handleUpdateStatus = async (overrideStatus, overrideComment) => {
    const targetStatus = overrideStatus || newStatus;
    const targetComment = overrideComment !== undefined ? overrideComment : statusComment;
    if (!selectedIssue || !targetStatus) return;

    if (targetStatus === 'rejected' && !targetComment.trim()) {
      setStatusMessage('Error: Please provide a reason for rejecting this report.');
      return;
    }
    if (targetStatus === 'more_information_needed' && !targetComment.trim()) {
      setStatusMessage('Error: Please provide notes explaining what additional information is required from the resident.');
      return;
    }

    setUpdatingStatus(true);
    setStatusMessage(null);

    const authToken = token || localStorage.getItem('gaunpulse_auth_token');
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const payload = {
      status: targetStatus,
      comment: targetComment.trim() || `Status updated to ${targetStatus.replace(/_/g, ' ')}`,
      verification_notes: targetStatus === 'verified' ? (targetComment.trim() || 'Verified on-site by municipal technical officer.') : undefined,
      rejection_reason: targetStatus === 'rejected' ? targetComment.trim() : undefined,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.message || 'Failed to update status.');
      }

      const updatedData = updated.data || updated;
      setStatusMessage(`Report status updated to ${targetStatus.replace(/_/g, ' ').toUpperCase()}. Resident notification created.`);
      setSelectedIssue(updatedData);
      setNewStatus(updatedData.status);
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

  const pendingCount = issues.filter((item) => {
    const st = norm(item.status);
    return st === 'pending_verification' || st === 'submitted';
  }).length;

  const filteredIssues = issues.filter((item) => {
    if (activeTab === 'pending_verification') {
      const st = norm(item.status);
      if (st !== 'pending_verification' && st !== 'submitted') {
        return false;
      }
    }
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

      {/* Verification Queue & All Issues Tabs */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '4px' }}>
        <button
          type="button"
          className={`button ${activeTab === 'all' ? 'button--primary' : 'button--secondary'}`}
          onClick={() => setActiveTab('all')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
        >
          <Layers size={15} /> All Municipal Issues ({issues.length})
        </button>
        <button
          type="button"
          className={`button ${activeTab === 'pending_verification' ? 'button--primary' : 'button--secondary'}`}
          onClick={() => setActiveTab('pending_verification')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
        >
          <Inbox size={15} /> Citizen Reports Awaiting Verification
          {pendingCount > 0 && (
            <span style={{
              background: activeTab === 'pending_verification' ? '#fff' : '#c64f45',
              color: activeTab === 'pending_verification' ? '#123d30' : '#fff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pending_verification' && (
        <div style={{
          padding: '12px 16px',
          background: '#fefce8',
          border: '1px solid #fde047',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          color: '#854d0e',
          fontSize: '13px',
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0, color: '#ca8a04' }} />
          <div>
            <strong>Citizen Incident Verification Queue:</strong> These reports were filed directly by citizens via the Citizen Portal and include photographic evidence, audio recordings, or speech-to-text transcripts. They are kept isolated from confirmed infrastructure disruptions until verified on-site by ward or municipal engineers.
          </div>
        </div>
      )}

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
            <option value="pending_verification">Pending Verification</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="more_information_needed">Action Needed</option>
            <option value="verified">Verified</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader
          eyebrow={activeTab === 'pending_verification' ? 'Verification Queue' : 'Triage queue'}
          title={activeTab === 'pending_verification' ? `Citizen Reports Awaiting Verification (${filteredIssues.length})` : `Registered Infrastructure Issues (${filteredIssues.length})`}
          description={activeTab === 'pending_verification' ? 'Review unverified citizen complaints, inspect audio recordings and photographic evidence, and approve or reject.' : 'Click any issue row to view complete details, history timeline, and update municipal verification status.'}
          action={<LiveLabel text={activeTab === 'pending_verification' ? 'Verification Inbox' : 'Live Triage Queue'} compact />}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
            Loading infrastructure issues from database...
          </div>
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={activeTab === 'pending_verification' ? 'No pending citizen reports' : 'No issues found matching current criteria'}
            description={activeTab === 'pending_verification' ? 'All citizen reports for this workspace have been verified or reviewed.' : 'Try clearing search filters or report a new issue to log municipal records.'}
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
                  <th>Issue & Evidence</th>
                  <th>Village / Settlement</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Photo indicator */}
                        {(item.photo_url || (item.complaint?.media && item.complaint.media.some(m => m.media_type === 'image'))) && (
                          <span title="Has photo attachment" style={{ color: '#176342', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', background: '#eef6f2', padding: '2px 6px', borderRadius: '4px' }}>
                            <Camera size={12} />
                            <span>
                              {item.complaint?.media ? item.complaint.media.filter(m => m.media_type === 'image').length : 1}
                            </span>
                          </span>
                        )}
                        {/* Audio indicator */}
                        {item.complaint?.media && item.complaint.media.some(m => m.media_type === 'audio') && (
                          <span title="Has voice note" style={{ color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                            <Volume2 size={12} />
                            <span>Audio</span>
                          </span>
                        )}
                        {/* Speech Transcript indicator */}
                        {(item.speech_transcript || item.complaint?.speech_transcript) && (
                          <span title="Has speech-to-text transcript" style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                            <FileText size={12} />
                            <span>Transcript</span>
                          </span>
                        )}
                        <strong>{item.title}</strong>
                      </div>
                      <small style={{ display: 'block', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {item.tracking_code || `GP-ISSUE-${item.id}`} {item.edge ? `· Linked to ${item.edge.name}` : ''}
                      </small>
                    </td>
                    <td>
                      <strong>{item.settlement_name || item.complaint?.settlement_name || item.village?.name || 'Municipal Area'}</strong>
                      <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                        {item.village?.municipality || 'Municipal Workspace'} {item.ward_no || item.village?.ward_no || item.complaint?.ward_number ? `· Ward ${item.ward_no || item.village?.ward_no || item.complaint?.ward_number}` : ''}
                      </small>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        {(item.category || '').replace(/_/g, ' ')}
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
                        {['pending_verification', 'submitted'].includes(norm(item.status)) ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 600 }}>
                            <ShieldAlert size={12} /> Review
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={12} /> View
                          </span>
                        )}
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
                  <span><strong>Village / Settlement:</strong> {selectedIssue.settlement_name || selectedIssue.complaint?.settlement_name || selectedIssue.village?.name || 'Municipal Area'}</span>
                  <span><strong>Ward:</strong> Ward {selectedIssue.ward_no || selectedIssue.village?.ward_no || selectedIssue.complaint?.ward_number || 'N/A'}</span>
                  {selectedIssue.edge && <span><strong>Asset:</strong> {selectedIssue.edge.name}</span>}
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}><strong>Coordinates:</strong> {selectedIssue.latitude}, {selectedIssue.longitude}</span>
                  {selectedIssue.reporter_name && <span><strong>Reporter:</strong> {selectedIssue.reporter_name} ({selectedIssue.reporter_phone || 'Resident'})</span>}
                </div>

                {/* Speech-to-Text Transcription Box */}
                {(selectedIssue.speech_transcript || selectedIssue.complaint?.speech_transcript) && (
                  <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f8fafc', borderLeft: '4px solid #123d30', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#123d30', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      <FileText size={14} /> Citizen Speech Transcription (Nepali / English via Web Speech)
                    </div>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                      "{selectedIssue.speech_transcript || selectedIssue.complaint?.speech_transcript}"
                    </p>
                  </div>
                )}

                {/* Attached Audio Evidence (Voice Recording) */}
                {selectedIssue.complaint?.media && selectedIssue.complaint.media.some((m) => m.media_type === 'audio') && (
                  <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '12.5px', fontWeight: 700, marginBottom: '8px' }}>
                      <Volume2 size={16} /> Attached Citizen Voice Recording
                    </div>
                    {selectedIssue.complaint.media.filter((m) => m.media_type === 'audio').map((audioItem) => (
                      <div key={audioItem.id} style={{ marginBottom: '6px' }}>
                        <small style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          {audioItem.original_name} {audioItem.file_size ? `(${Math.round(audioItem.file_size / 1024)} KB)` : ''}
                        </small>
                        <audio controls src={audioItem.url} style={{ width: '100%', height: '36px' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Multi-Photo Evidence Gallery */}
                {((selectedIssue.complaint?.media && selectedIssue.complaint.media.some((m) => m.media_type === 'image')) || selectedIssue.photo_url) && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Attached Photographic Evidence:
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                      {selectedIssue.complaint?.media && selectedIssue.complaint.media.filter((m) => m.media_type === 'image').length > 0 ? (
                        selectedIssue.complaint.media.filter((m) => m.media_type === 'image').map((mediaItem) => (
                          <a key={mediaItem.id} href={mediaItem.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' }}>
                            <img
                              src={mediaItem.url}
                              alt={mediaItem.original_name}
                              style={{
                                width: '100%',
                                height: '90px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                objectFit: 'cover',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                              }}
                            />
                            <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {mediaItem.original_name}
                            </small>
                          </a>
                        ))
                      ) : selectedIssue.photo_url ? (
                        <a href={selectedIssue.photo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                          <img
                            src={selectedIssue.photo_url}
                            alt={selectedIssue.title}
                            style={{
                              maxHeight: '160px',
                              maxWidth: '100%',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              objectFit: 'cover',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            }}
                          />
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update & Municipal Verification Panel */}
              <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13.5px', fontWeight: 600 }}>
                    Municipal Verification & Lifecycle Actions
                  </h4>
                  <StatusBadge tone={statusTones[selectedIssue.status]}>
                    {(selectedIssue.status || '').replace(/_/g, ' ')}
                  </StatusBadge>
                </div>

                {statusMessage && (
                  <div style={{ padding: '8px 12px', background: statusMessage.startsWith('Error') ? 'var(--danger-bg)' : 'var(--success-bg)', border: `1px solid ${statusMessage.startsWith('Error') ? 'rgba(198,79,69,0.3)' : 'var(--success-border)'}`, borderRadius: 'var(--radius-sm)', fontSize: '12px', color: statusMessage.startsWith('Error') ? 'var(--danger)' : 'var(--success)', marginBottom: '10px' }}>
                    {statusMessage}
                  </div>
                )}

                {/* Existing Verification Metadata if already verified or rejected */}
                {(selectedIssue.verified_at || selectedIssue.rejection_reason) && (
                  <div style={{ padding: '10px 12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '12px', marginBottom: '12px' }}>
                    {selectedIssue.verified_at && (
                      <div style={{ color: '#166534', marginBottom: selectedIssue.verification_notes ? '4px' : 0 }}>
                        <strong>✓ Verified On:</strong> {new Date(selectedIssue.verified_at).toLocaleString()}
                        {selectedIssue.verification_notes && (
                          <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                            <strong>Notes:</strong> {selectedIssue.verification_notes}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedIssue.rejection_reason && (
                      <div style={{ color: '#991b1b' }}>
                        <strong>✕ Closed / Rejection Reason:</strong> {selectedIssue.rejection_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Verification Actions for Pending Reports */}
                {['pending_verification', 'submitted', 'more_information_needed'].includes(norm(selectedIssue.status)) && (
                  <div style={{ marginBottom: '14px', padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      ON-SITE VERIFICATION ACTION (WARD & MUNICIPAL ENGINEERS):
                    </span>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Unverified reports remain isolated from confirmed incident models. Confirming this report promotes it to active status across Simulation, Prioritization, and Action Plan modules.
                    </p>
                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Verification inspection notes, requested resident details, or rejection reason..."
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleUpdateStatus('verified')}
                        disabled={updatingStatus}
                        style={{ background: '#166534', color: '#fff', fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle2 size={14} /> Verify Report (Confirm Disruption)
                      </button>
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleUpdateStatus('more_information_needed')}
                        disabled={updatingStatus}
                        style={{ background: '#ca8a04', color: '#fff', fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <HelpCircle size={14} /> Request More Info
                      </button>
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleUpdateStatus('rejected')}
                        disabled={updatingStatus}
                        style={{ background: '#b91c1c', color: '#fff', fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <XCircle size={14} /> Reject Report
                      </button>
                    </div>
                  </div>
                )}

                {/* Standard Status Dropdown for Full Lifecycle */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Update Lifecycle Status:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', fontSize: '12.5px' }}
                    >
                      <option value="pending_verification">Pending Verification</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="verified">Verified (Confirmed On-Site)</option>
                      <option value="more_information_needed">More Information Needed</option>
                      <option value="in_progress">In Progress (Work Underway)</option>
                      <option value="resolved">Resolved (Repairs Completed)</option>
                      <option value="rejected">Rejected (Not Actionable)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Audit log comment or engineer remarks..."
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '12.5px' }}
                    />
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => handleUpdateStatus()}
                      disabled={updatingStatus}
                      style={{ height: '35px', fontSize: '12px' }}
                    >
                      {updatingStatus ? <Loader2 className="animate-spin" size={14} /> : 'Save Update'}
                    </button>
                  </div>
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
