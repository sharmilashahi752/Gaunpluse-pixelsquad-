import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
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
import { Card, CardHeader, EmptyState, FeatureNotice, PageIntro, StatusBadge } from '../components/ui';
import { deduplicateVillages, formatVillageLabel } from '../utils/villageUtils';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { useAuth } from '../context/AuthContext';
import { cachedFetchJson, invalidateApiCache } from '../utils/apiCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

// Case- and delimiter-insensitive status normalization
const norm = (s) => (s || '').toLowerCase().replace(/[\s-]+/g, '_');

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);
  const [perPage] = useState(20);
  const [loadError, setLoadError] = useState(null);

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

  // Complaint Review & Verification Modal states
  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [linkVillageId, setLinkVillageId] = useState('');
  const [isSavingVillage, setIsSavingVillage] = useState(false);
  const [villageSaveMessage, setVillageSaveMessage] = useState(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(true);

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

  // Load issues and villages with server-side pagination & filter scoping
  const loadData = async (forceOrOpts = false, maybeForce = false) => {
    let targetPage = currentPage;
    let force = false;

    if (typeof forceOrOpts === 'boolean') {
      force = forceOrOpts;
    } else if (typeof forceOrOpts === 'number') {
      targetPage = forceOrOpts;
      force = Boolean(maybeForce);
    } else if (forceOrOpts && typeof forceOrOpts === 'object') {
      targetPage = forceOrOpts.page || currentPage;
      force = Boolean(forceOrOpts.force);
    }

    if (issues.length === 0) setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        per_page: String(perPage),
      });
      if (filterCategory) params.append('category', filterCategory);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterStatus) params.append('status', filterStatus);
      if (activeTab === 'pending_verification') params.append('pending_only', '1');

      const [dataIssues, dataVillages] = await Promise.all([
        cachedFetchJson(`${API_BASE_URL}/api/issues?${params.toString()}`, {}, {
          force,
          ttlMs: 45000,
          onBackgroundUpdate: (fresh) => {
            if (fresh) {
              const freshList = fresh.data || (Array.isArray(fresh) ? fresh : []);
              setIssues(freshList);
              if (fresh.meta) {
                setTotalPages(fresh.meta.last_page || 1);
                setTotalIssues(fresh.meta.total || freshList.length);
              }
            }
          },
        }),
        contextVillages && contextVillages.length > 0
          ? Promise.resolve(contextVillages)
          : cachedFetchJson(`${API_BASE_URL}/api/villages`, {}, { ttlMs: 120000 }),
      ]);

      const issueList = dataIssues.data || (Array.isArray(dataIssues) ? dataIssues : []);
      const villageList = Array.isArray(dataVillages) ? dataVillages : [];

      setIssues(issueList);
      if (dataIssues.meta) {
        setTotalPages(dataIssues.meta.last_page || 1);
        setTotalIssues(dataIssues.meta.total || issueList.length);
        setCurrentPage(dataIssues.meta.current_page || targetPage);
      } else {
        setTotalPages(1);
        setTotalIssues(issueList.length);
      }
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
      setLoadError('Failed to load issues from server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData({ page: 1, force: false });
  }, [activeTab, filterCategory, filterSeverity, filterStatus]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    loadData({ page: newPage, force: false });
  };

  // Only load village edges when modal is open and village is selected (eliminates eager fetch on mount)
  useEffect(() => {
    if (!showCreateModal || !formData.village_id) {
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
  }, [showCreateModal, formData.village_id]);

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

  // Open complaint review modal, reset action states, and lazy-load complete audit trail & media
  const handleOpenIssueModal = (item) => {
    setSelectedIssue(item);
    setActionNotes('');
    setActionError(null);
    setActionSuccess(null);
    setShowRejectConfirm(false);
    setLinkVillageId(item.village_id ? String(item.village_id) : '');
    setIsSavingVillage(false);
    setVillageSaveMessage(null);
    setIsAuditTrailOpen(true);

    if (item.id) {
      cachedFetchJson(`${API_BASE_URL}/api/issues/${item.id}`, {}, { ttlMs: 30000 })
        .then((detailRes) => {
          const detail = detailRes.data || detailRes;
          if (detail && detail.id === item.id) {
            setSelectedIssue((prev) => (prev && prev.id === item.id ? { ...prev, ...detail } : prev));
          }
        })
        .catch((err) => {
          console.warn('Could not load detailed issue info:', err);
        });
    }
  };

  // Derive municipality / ward cross-jurisdiction restriction for modal issue
  const isCrossMunicipality = useMemo(() => {
    if (!selectedIssue || !authUser) return false;
    if (['system_admin', 'admin'].includes(authUser.role)) return false;
    const issueMuni = selectedIssue.municipality_id || selectedIssue.village?.municipality_id;
    if (authUser.role === 'municipality_admin') {
      return Boolean(issueMuni && String(issueMuni) !== String(authUser.municipality_id));
    }
    if (authUser.role === 'ward_officer') {
      const issueWard = selectedIssue.ward_no || selectedIssue.village?.ward_no;
      const muniMismatch = Boolean(issueMuni && String(issueMuni) !== String(authUser.municipality_id));
      const wardMismatch = Boolean(issueWard && String(issueWard) !== String(authUser.ward_number));
      return muniMismatch || wardMismatch;
    }
    return false;
  }, [selectedIssue, authUser]);

  // Village Assignment Handler: links village WITHOUT modifying report status
  const handleSaveVillageLink = async () => {
    if (!selectedIssue) return;
    setIsSavingVillage(true);
    setVillageSaveMessage(null);
    setActionError(null);

    const authToken = token || localStorage.getItem('gaunpulse_auth_token');
    if (!authToken) {
      setActionError('Authentication session not found. Please log in with official municipal staff credentials.');
      setIsSavingVillage(false);
      return;
    }

    const targetVillageId = linkVillageId ? Number(linkVillageId) : null;
    const villageName = targetVillageId
      ? (villages.find((v) => Number(v.id) === targetVillageId)?.name || 'Selected Village')
      : 'Unregistered Settlement';

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    const payload = {
      status: selectedIssue.status, // Keep current status intact!
      village_id: targetVillageId,
      comment: targetVillageId
        ? `Linked report to village registry: ${villageName}`
        : 'Set settlement to unregistered (awaiting municipal survey)',
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      let updated = {};
      try {
        updated = await res.json();
      } catch {
        updated = {};
      }

      if (!res.ok) {
        throw new Error(updated.message || 'Failed to update village linkage.');
      }

      const updatedData = updated.data || updated;
      setSelectedIssue(updatedData);
      setVillageSaveMessage(`Village assignment saved: ${villageName}. Status remains unchanged.`);
      invalidateApiCache('api/issues');
      invalidateApiCache('api/dashboard');
      invalidateApiCache('api/reports');
      loadData(true);
    } catch (err) {
      setActionError(`Village Assignment Error: ${err.message}`);
    } finally {
      setIsSavingVillage(false);
    }
  };

  // Main reviewer action dispatch: validates eligibility and requirements
  const handleReviewAction = (targetStatus) => {
    setActionError(null);
    setActionSuccess(null);
    setVillageSaveMessage(null);

    const authToken = token || localStorage.getItem('gaunpulse_auth_token');
    if (!authToken) {
      setActionError('Authentication required: Please sign in with an official municipal staff account to review reports.');
      return;
    }

    if (authUser && authUser.role === 'citizen') {
      setActionError('Citizen accounts are not authorized to perform municipal administrative actions.');
      return;
    }

    if (isCrossMunicipality) {
      setActionError('Permission denied: You cannot modify complaints outside your assigned municipality or ward.');
      return;
    }

    // 1. Eligibility validation for Verification
    if (targetStatus === 'verified') {
      const eligible = ['submitted', 'pending_verification', 'under_review', 'more_information_needed'];
      if (!eligible.includes(norm(selectedIssue.status))) {
        setActionError(`This report cannot be verified in its current status (${selectedIssue.status}).`);
        return;
      }
      // Verification does not require rejection reason. Notes are optional.
      executeStatusUpdate('verified');
      return;
    }

    // 2. Validation for Request More Info
    if (targetStatus === 'more_information_needed') {
      if (!actionNotes.trim()) {
        setActionError('Please provide notes explaining what additional information or documentation is required from the resident.');
        return;
      }
      executeStatusUpdate('more_information_needed');
      return;
    }

    // 3. Validation for Reject Report
    if (targetStatus === 'rejected') {
      if (!actionNotes.trim()) {
        setActionError('Please provide a reason for rejecting this report.');
        return;
      }
      // Require confirmation dialog before submitting rejection!
      setShowRejectConfirm(true);
      return;
    }

    // 4. Lifecycle updates (in_progress, resolved)
    executeStatusUpdate(targetStatus);
  };

  // Submit status update to backend
  const executeStatusUpdate = async (targetStatus) => {
    if (!selectedIssue) return;
    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const authToken = token || localStorage.getItem('gaunpulse_auth_token');
    if (!authToken) {
      setActionError('Authentication session not found. Please log in with municipal staff credentials.');
      setIsActionLoading(false);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    const notesTrimmed = actionNotes.trim();
    const payload = {
      status: targetStatus,
      comment: notesTrimmed || (targetStatus === 'verified' ? 'Verified on-site by municipal technical staff.' : `Status updated to ${targetStatus.replace(/_/g, ' ')}`),
      verification_notes: targetStatus === 'verified' ? (notesTrimmed || 'Verified on-site by municipal technical staff.') : undefined,
      rejection_reason: targetStatus === 'rejected' ? notesTrimmed : undefined,
    };
    if (linkVillageId) {
      payload.village_id = Number(linkVillageId);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      let updated = {};
      try {
        updated = await res.json();
      } catch {
        updated = {};
      }

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        } else if (res.status === 403) {
          throw new Error(updated.message || 'Permission denied: Official municipal staff credentials are required.');
        } else if (res.status === 422) {
          const detail = updated.message || (updated.errors ? Object.values(updated.errors).flat().join(' ') : 'Invalid review input.');
          throw new Error(detail);
        } else {
          throw new Error(updated.message || `Server returned error (${res.status}). Please try again.`);
        }
      }

      const updatedData = updated.data || updated;
      const successText = matchSuccessMessage(targetStatus);
      setActionSuccess(successText);
      setSelectedIssue(updatedData);
      setActionNotes('');
      setShowRejectConfirm(false);
      invalidateApiCache('api/issues');
      invalidateApiCache('api/dashboard');
      invalidateApiCache('api/reports');
      loadData(true);
    } catch (err) {
      setActionError(err.message || 'An error occurred while updating the report.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const matchSuccessMessage = (status) => {
    switch (status) {
      case 'verified':
        return 'Report verified successfully. Disruption confirmed and queued for municipal repair planning.';
      case 'more_information_needed':
        return 'Request sent to resident. Report status set to action needed and notification dispatched.';
      case 'rejected':
        return 'Report rejected and closed. Decision and remarks recorded in the municipal audit trail.';
      case 'in_progress':
        return 'Status updated to In Progress. Repair work has commenced.';
      case 'resolved':
        return 'Report marked as Resolved. Infrastructure repair recorded as complete.';
      default:
        return `Report status updated to ${status.replace(/_/g, ' ')}.`;
    }
  };

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
          title={activeTab === 'pending_verification' ? `Citizen Reports Awaiting Verification (${totalIssues || filteredIssues.length})` : `Registered Infrastructure Issues (${totalIssues || filteredIssues.length})`}
          description={activeTab === 'pending_verification' ? 'Review unverified citizen complaints, inspect audio recordings and photographic evidence, and approve or reject.' : 'Click any issue row to view complete details, history timeline, and update municipal verification status.'}
        />

        {loadError && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(198,79,69,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '12.5px',
            margin: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{loadError}</span>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => loadData({ page: currentPage, force: true })}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

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
                    onClick={() => handleOpenIssueModal(item)}
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
                      <div>
                        <strong>{item.settlement_name || item.complaint?.settlement_name || item.village?.name || 'Municipal Area'}</strong>
                        {(item.settlement_name || item.complaint?.settlement_name) && !item.village_id && (
                          <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', marginLeft: '5px', fontWeight: 600 }}>
                            Unregistered
                          </span>
                        )}
                      </div>
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
                          handleOpenIssueModal(item);
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

        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div>
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalIssues} total records)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="button button--secondary"
                disabled={currentPage <= 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Previous
              </button>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {prev && p - prev > 1 && <span style={{ padding: '0 2px' }}>...</span>}
                        <button
                          type="button"
                          className={`button ${currentPage === p ? 'button--primary' : 'button--secondary'}`}
                          onClick={() => handlePageChange(p)}
                          style={{ padding: '4px 9px', fontSize: '12px', minWidth: '28px', height: '28px' }}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
              </div>
              <button
                type="button"
                className="button button--secondary"
                disabled={currentPage >= totalPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE ISSUE MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !isSubmitting && setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
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

      {/* COMPLAINT DETAILS & REVIEW MODAL */}
      {selectedIssue && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isActionLoading) {
              setSelectedIssue(null);
            }
          }}
        >
          <div className="modal-card modal-card--lg" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#FFFFFF' }}>
            
            {/* 1. HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#64748B' }}>
                    {selectedIssue.tracking_code || `GP-${selectedIssue.id}`}
                  </span>
                  <StatusBadge tone={getSeverityTone(selectedIssue.severity)}>
                    {selectedIssue.severity}
                  </StatusBadge>
                  <StatusBadge tone={getStatusTone(selectedIssue.status)}>
                    {selectedIssue.status ? selectedIssue.status.replace(/_/g, ' ') : 'Submitted'}
                  </StatusBadge>
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#123D30', lineHeight: 1.3 }}>
                  {selectedIssue.title}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isActionLoading && setSelectedIssue(null)}
                aria-label="Close"
                disabled={isActionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>

              {/* 2. COMPLAINT DETAILS */}
              <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#123D30', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Complaint Details
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {selectedIssue.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600 }}>Reporter</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {selectedIssue.reporter_name || 'Community Resident'}
                    </strong>
                    {selectedIssue.reporter_phone && (
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>
                        {selectedIssue.reporter_phone}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600 }}>Village / Settlement</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {selectedIssue.settlement_name || selectedIssue.village?.name || 'Unregistered Settlement'}
                    </strong>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>
                      Ward {selectedIssue.ward_no || selectedIssue.village?.ward_no || selectedIssue.complaint?.ward_number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600 }}>Location</span>
                    <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      {selectedIssue.latitude?.toFixed(4)}, {selectedIssue.longitude?.toFixed(4)}
                    </span>
                    {selectedIssue.edge && (
                      <span style={{ color: '#123D30', fontSize: '11px', fontWeight: 600 }}>
                        Asset: {selectedIssue.edge.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence Attachments: Audio & Voice Recording */}
                {selectedIssue.complaint?.media && selectedIssue.complaint.media.some((m) => m.media_type === 'audio') && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#123D30', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                      <Volume2 size={15} /> Citizen Voice Recording
                    </div>
                    {selectedIssue.complaint.media.filter((m) => m.media_type === 'audio').map((audioItem) => (
                      <div key={audioItem.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <audio controls src={audioItem.url} style={{ height: '36px', flex: 1, minWidth: '220px' }} />
                        <a
                          href={audioItem.url}
                          download={audioItem.original_name || `gaunpulse-voice-${selectedIssue.id}.webm`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button--secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', textDecoration: 'none' }}
                        >
                          <Download size={13} /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Evidence Attachments: Speech Transcript */}
                {(selectedIssue.speech_transcript || selectedIssue.complaint?.speech_transcript) && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: '#F8FAFC', borderLeft: '3px solid #123D30', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#123D30' }}>Speech Transcription</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                        {selectedIssue.transcript_language === 'en-US' || selectedIssue.complaint?.transcript_language === 'en-US' ? 'English' : 'Nepali'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                      "{selectedIssue.speech_transcript || selectedIssue.complaint?.speech_transcript}"
                    </p>
                  </div>
                )}

                {/* Evidence Attachments: Photo Gallery */}
                {((selectedIssue.complaint?.media && selectedIssue.complaint.media.some((m) => m.media_type === 'image')) || selectedIssue.photo_url) && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Attached Photographic Evidence:
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {selectedIssue.complaint?.media && selectedIssue.complaint.media.filter((m) => m.media_type === 'image').length > 0 ? (
                        selectedIssue.complaint.media.filter((m) => m.media_type === 'image').map((mediaItem) => (
                          <a key={mediaItem.id} href={mediaItem.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                            <img
                              src={mediaItem.url}
                              alt={mediaItem.original_name}
                              style={{ width: '84px', height: '84px', borderRadius: '6px', border: '1px solid var(--border)', objectFit: 'cover' }}
                            />
                          </a>
                        ))
                      ) : selectedIssue.photo_url ? (
                        <a href={selectedIssue.photo_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={selectedIssue.photo_url}
                            alt={selectedIssue.title}
                            style={{ maxHeight: '110px', borderRadius: '6px', border: '1px solid var(--border)', objectFit: 'cover' }}
                          />
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. VILLAGE ASSIGNMENT */}
              <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#123D30', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Village Assignment
                </h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={linkVillageId}
                    onChange={(e) => {
                      setLinkVillageId(e.target.value);
                      setVillageSaveMessage(null);
                      setActionError(null);
                    }}
                    disabled={isSavingVillage || isActionLoading}
                    style={{ flex: 1, minWidth: '220px', padding: '8px 12px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid var(--border)', background: '#FFFFFF' }}
                  >
                    <option value="">-- Unregistered Settlement (Awaiting Survey) --</option>
                    {dedupedVillages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.municipality || 'Municipal Area'}, Ward {v.ward_no || 1})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleSaveVillageLink}
                    disabled={isSavingVillage || isActionLoading || linkVillageId === String(selectedIssue.village_id || '')}
                    style={{ height: '36px', fontSize: '12px' }}
                  >
                    {isSavingVillage ? <Loader2 className="animate-spin" size={14} /> : 'Save Assignment'}
                  </button>
                </div>
                {villageSaveMessage && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#15803D', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> {villageSaveMessage}
                  </div>
                )}
              </div>

              {/* 4. REVIEW COMPLAINT */}
              <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#123D30', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Review Complaint
                  </h3>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Current status: <strong style={{ color: '#123D30' }}>{selectedIssue.status?.replace(/_/g, ' ')}</strong>
                  </span>
                </div>

                {/* Inspection metadata banner if already verified or rejected */}
                {(selectedIssue.verified_at || selectedIssue.rejection_reason) && (
                  <div style={{ padding: '10px 12px', background: selectedIssue.verified_at ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${selectedIssue.verified_at ? '#BBF7D0' : '#FECACA'}`, borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                    {selectedIssue.verified_at && (
                      <div style={{ color: '#166534' }}>
                        <strong>✓ Verified by:</strong> {selectedIssue.verifier_name || 'Municipal Engineering Staff'} on {new Date(selectedIssue.verified_at).toLocaleString()}
                        {selectedIssue.verification_notes && (
                          <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                            <strong>Inspection Notes:</strong> {selectedIssue.verification_notes}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedIssue.rejection_reason && (
                      <div style={{ color: '#991B1B' }}>
                        <strong>✕ Rejection Reason:</strong> {selectedIssue.rejection_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Banners */}
                {actionSuccess && (
                  <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '6px', fontSize: '12.5px', color: '#166534', fontWeight: 500, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> {actionSuccess}
                  </div>
                )}

                {/* Review Notes Textarea */}
                <div style={{ marginBottom: '12px' }}>
                  <textarea
                    rows={2}
                    placeholder="Enter inspection remarks, information requested from resident, or reason for decision..."
                    value={actionNotes}
                    onChange={(e) => {
                      setActionNotes(e.target.value);
                      setActionError(null);
                    }}
                    disabled={isActionLoading}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: actionError ? '1px solid #DC2626' : '1px solid var(--border)', fontSize: '12.5px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  {actionError && (
                    <div style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={13} /> {actionError}
                    </div>
                  )}
                </div>

                {/* Jurisdiction / Authentication status banner */}
                {!token && !localStorage.getItem('gaunpulse_auth_token') && (
                  <div style={{ padding: '8px 12px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '12px', color: '#92400E', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>Sign in with municipal staff credentials to verify, request information, or reject reports.</span>
                    <button
                      type="button"
                      className="button button--secondary"
                      style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const publicBase = import.meta.env.VITE_PUBLIC_URL || 'http://localhost:5173';
                        window.location.href = `${publicBase}/login`;
                      }}
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {authUser && authUser.role === 'citizen' && (
                  <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '12px', color: '#991B1B', marginBottom: '12px' }}>
                    Citizen accounts cannot perform municipal verifications. Please sign in with official municipal staff credentials.
                  </div>
                )}

                {isCrossMunicipality && (
                  <div style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                    This complaint is outside your assigned municipal jurisdiction. Modification is restricted to local staff or System Administrators.
                  </div>
                )}

                {/* Actions: If Report is Unverified/Pending */}
                {['submitted', 'pending_verification', 'under_review', 'more_information_needed'].includes(norm(selectedIssue.status)) ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => handleReviewAction('verified')}
                      disabled={isActionLoading || isCrossMunicipality || (!token && !localStorage.getItem('gaunpulse_auth_token')) || (authUser && authUser.role === 'citizen')}
                      style={{ height: '36px', fontSize: '12px' }}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                      Verify Report
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => handleReviewAction('more_information_needed')}
                      disabled={isActionLoading || isCrossMunicipality || (!token && !localStorage.getItem('gaunpulse_auth_token')) || (authUser && authUser.role === 'citizen')}
                      style={{ height: '36px', fontSize: '12px', background: '#D97706', color: '#FFFFFF', border: '1px solid #D97706' }}
                    >
                      <HelpCircle size={14} />
                      Request More Info
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => handleReviewAction('rejected')}
                      disabled={isActionLoading || isCrossMunicipality || (!token && !localStorage.getItem('gaunpulse_auth_token')) || (authUser && authUser.role === 'citizen')}
                      style={{ height: '36px', fontSize: '12px', background: '#DC2626', color: '#FFFFFF', border: '1px solid #DC2626' }}
                    >
                      <XCircle size={14} />
                      Reject Report
                    </button>
                  </div>
                ) : (
                  /* Actions: If Report is Already Verified / In Progress / Resolved / Rejected */
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {norm(selectedIssue.status) === 'verified' && (
                      <>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => handleReviewAction('in_progress')}
                          disabled={isActionLoading}
                          style={{ height: '36px', fontSize: '12px' }}
                        >
                          <Clock size={14} />
                          Begin Repairs (In Progress)
                        </button>
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => handleReviewAction('resolved')}
                          disabled={isActionLoading}
                          style={{ height: '36px', fontSize: '12px' }}
                        >
                          <CheckCircle2 size={14} />
                          Mark Resolved
                        </button>
                      </>
                    )}
                    {norm(selectedIssue.status) === 'in_progress' && (
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={() => handleReviewAction('resolved')}
                        disabled={isActionLoading}
                        style={{ height: '36px', fontSize: '12px' }}
                      >
                        <CheckCircle2 size={14} />
                        Mark Repairs Resolved
                      </button>
                    )}
                    {norm(selectedIssue.status) === 'resolved' && (
                      <span style={{ fontSize: '12.5px', color: '#166534', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={15} /> All repairs completed and verified.
                      </span>
                    )}
                    {norm(selectedIssue.status) === 'rejected' && (
                      <span style={{ fontSize: '12.5px', color: '#991B1B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <XCircle size={15} /> Report has been rejected and closed.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 5. ACTIVITY HISTORY */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
                <button
                  type="button"
                  onClick={() => setIsAuditTrailOpen(!isAuditTrailOpen)}
                  style={{ width: '100%', padding: '12px 16px', background: '#F8FAFC', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#123D30' }}>
                    Activity History & Audit Trail ({selectedIssue.updates?.length || 0})
                  </span>
                  {isAuditTrailOpen ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                </button>

                {isAuditTrailOpen && (
                  <div style={{ padding: '14px 16px', display: 'grid', gap: '8px' }}>
                    {selectedIssue.updates && selectedIssue.updates.length > 0 ? (
                      selectedIssue.updates.map((upd, i) => (
                        <div key={upd.id || i} style={{ padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#123D30' }}>
                              {upd.old_status ? `${upd.old_status} → ${upd.new_status}` : (upd.new_status || upd.status)}
                            </span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {new Date(upd.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', marginBottom: '3px' }}>
                            Official: <strong>{upd.user_name || 'Municipal Officer'}</strong>
                          </div>
                          {upd.comment && (
                            <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: 'italic', fontSize: '12px' }}>
                              "{upd.comment}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                        No audit history recorded yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR REJECTION */}
      {showRejectConfirm && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 1100, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          onClick={(e) => e.target === e.currentTarget && !isActionLoading && setShowRejectConfirm(false)}
        >
          <div className="modal-card" style={{ maxWidth: '440px', padding: '24px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B91C1C', marginBottom: '12px' }}>
              <AlertTriangle size={22} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Confirm Report Rejection</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
              Are you sure you want to reject this complaint? This will close the report and dispatch a rejection notice with your remarks to the resident.
            </p>
            <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '12.5px', color: '#991B1B', marginBottom: '18px' }}>
              <strong>Rejection Reason:</strong> "{actionNotes.trim()}"
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="button button--secondary"
                disabled={isActionLoading}
                onClick={() => setShowRejectConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button"
                style={{ background: '#B91C1C', color: '#FFFFFF' }}
                disabled={isActionLoading}
                onClick={() => executeStatusUpdate('rejected')}
              >
                {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
