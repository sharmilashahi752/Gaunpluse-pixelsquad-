import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import StatusBadge from './StatusBadge';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  MapPin,
  Calendar,
  Volume2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function MyComplaints({ selectedComplaintId, onSelectComplaint, lang = 'ne' }) {
  const [complaints, setComplaints] = useState({ data: [] });
  const [filters, setFilters] = useState({ search: '', status: 'all', category: 'all' });
  const [selectedId, setSelectedId] = useState(selectedComplaintId || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isNe = lang === 'ne';

  useEffect(() => {
    if (selectedComplaintId) {
      setSelectedId(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  async function loadComplaints() {
    setLoading(true);
    setError('');
    try {
      const data = await citizenService.getComplaints(filters);
      setComplaints(data || { data: [] });
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError(
        err.response?.data?.message ||
          (isNe
            ? 'उजुरी सूची लोड गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।'
            : 'Unable to load complaints list. Please check your connection and retry.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [filters.search, filters.status, filters.category]);

  // Safely extract complaint array from various response formats
  const complaintList = Array.isArray(complaints)
    ? complaints
    : Array.isArray(complaints?.data)
    ? complaints.data
    : Array.isArray(complaints?.complaints?.data)
    ? complaints.complaints.data
    : Array.isArray(complaints?.complaints)
    ? complaints.complaints
    : [];

  if (selectedId) {
    return (
      <div className="citizen-page">
        <button
          type="button"
          className="citizen-text-button back-btn"
          onClick={() => {
            setSelectedId(null);
            onSelectComplaint?.(null);
          }}
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={16} /> {isNe ? 'उजुरी सूचीमा फर्कनुहोस्' : 'Back to My Complaints'}
        </button>
        <ComplaintDetails
          complaintId={selectedId}
          lang={lang}
          onUpdated={loadComplaints}
          onBack={() => {
            setSelectedId(null);
            onSelectComplaint?.(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>{isNe ? 'नागरिक सेवा अभिलेख' : 'Citizen Service History'}</p>
          <h1>{isNe ? 'मेरा पूर्वाधार उजुरीहरू' : 'My Infrastructure Reports'}</h1>
          <span>
            {isNe
              ? 'विगतका उजुरीहरू हेर्नुहोस्, इन्जिनियरिङ प्रगति ट्र्याक गर्नुहोस् र नगरपालिकाको आधिकारिक प्रतिक्रिया पढ्नुहोस्।'
              : 'View past complaints, track engineering progress, and read municipal responses.'}
          </span>
        </div>
      </div>

      <div className="complaint-filters">
        <input
          placeholder={isNe ? 'उजुरी नम्बर वा विवरण खोज्नुहोस्...' : 'Search by ID or description keyword...'}
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="all">{isNe ? 'सबै स्थितिहरू' : 'All Statuses'}</option>
          <option value="pending">{isNe ? 'समीक्षा बाँकी' : 'Pending Review'}</option>
          <option value="verified">{isNe ? 'प्रमाणित' : 'Verified'}</option>
          <option value="more_information_needed">{isNe ? 'थप जानकारी आवश्यक' : 'Action Needed (More Info)'}</option>
          <option value="in_progress">{isNe ? 'कार्य प्रगतिमा' : 'In Progress'}</option>
          <option value="resolved">{isNe ? 'समाधान भएको' : 'Resolved'}</option>
          <option value="withdrawn">{isNe ? 'फिर्ता लिइएको' : 'Withdrawn'}</option>
          <option value="rejected">{isNe ? 'अस्वीकृत' : 'Rejected'}</option>
        </select>
        <select
          value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        >
          <option value="all">{isNe ? 'सबै वर्गहरू' : 'All Categories'}</option>
          <option value="Road Damage">Road Damage</option>
          <option value="Bridge Damage">Bridge Damage</option>
          <option value="Drinking Water">Drinking Water</option>
          <option value="Water Pipeline">Water Pipeline</option>
          <option value="Drainage">Drainage</option>
          <option value="Flood Damage">Flood Damage</option>
          <option value="Landslide">Landslide</option>
          <option value="School Infrastructure">School Infrastructure</option>
          <option value="Health Facility">Health Facility</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#9a3412',
            fontSize: '13.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#c2410c" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadComplaints}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#ea580c',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            <span>{isNe ? 'पुनः प्रयास' : 'Retry'}</span>
          </button>
        </div>
      )}

      <section className="citizen-card">
        {loading ? (
          <div className="citizen-loading-inner">
            {isNe ? 'उजुरीहरू लोड हुँदैछ...' : 'Loading reports...'}
          </div>
        ) : complaintList.length === 0 ? (
          <p className="citizen-empty">
            {isNe
              ? 'कुनै पूर्वाधार उजुरी भेटिएन।'
              : 'No infrastructure reports match the selected filters.'}
          </p>
        ) : (
          <div className="citizen-table-wrap">
            <table className="citizen-table">
              <thead>
                <tr>
                  <th>{isNe ? 'ट्र्याकिङ कोड' : 'Tracking ID'}</th>
                  <th>{isNe ? 'शीर्षक' : 'Title'}</th>
                  <th>{isNe ? 'वर्ग' : 'Category'}</th>
                  <th>{isNe ? 'वडा / गाउँ' : 'Ward / Village'}</th>
                  <th>{isNe ? 'दर्ता मिति' : 'Date Filed'}</th>
                  <th>{isNe ? 'स्थिति' : 'Status'}</th>
                  <th>{isNe ? 'कार्य' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {complaintList.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>
                      <code className="tracking-code-pill">{complaint.complaint_number}</code>
                    </td>
                    <td>
                      <strong>{complaint.title}</strong>
                    </td>
                    <td>{complaint.category}</td>
                    <td>
                      {complaint.village?.name || 'Village'}{' '}
                      {complaint.ward_number ? `(W${complaint.ward_number})` : ''}
                    </td>
                    <td>
                      {new Date(complaint.submitted_at || complaint.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={complaint.status} lang={lang} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="citizen-primary small-btn"
                        onClick={() => setSelectedId(complaint.id)}
                      >
                        {isNe ? 'विवरण हेर्नुहोस्' : 'View & Track'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ComplaintDetails({ complaintId, onUpdated, onBack, lang = 'ne' }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const isNe = lang === 'ne';

  async function loadComplaint() {
    setLoading(true);
    setError('');
    try {
      const response = await citizenService.getComplaint(complaintId);
      setComplaint(response.complaint);
      setError('');
      onUpdated?.();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (isNe ? 'उजुरीको विवरण लोड गर्न सकिएन।' : 'Complaint details could not be loaded.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  async function withdraw() {
    const confirmMsg = isNe
      ? 'के तपाईं साँच्चै यो उजुरी फिर्ता लिन चाहनुहुन्छ?'
      : 'Are you sure you want to withdraw this complaint? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
    setWithdrawing(true);
    try {
      await citizenService.withdrawComplaint(complaintId);
      await loadComplaint();
    } catch (err) {
      alert(err.response?.data?.message || (isNe ? 'उजुरी फिर्ता लिन असफल।' : 'Failed to withdraw complaint.'));
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="citizen-loading-inner">
        {isNe ? 'उजुरीको प्रत्यक्ष स्थिति लोड हुँदैछ...' : 'Loading live complaint status...'}
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="citizen-card" style={{ padding: '32px', textAlign: 'center' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ margin: '0 0 8px', color: '#991b1b' }}>
          {error || (isNe ? 'उजुरी भेटिएन।' : 'Complaint not found.')}
        </h3>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
          {isNe
            ? 'उजुरीको विवरण प्राप्त गर्न सकिएन। कृपया इन्टरनेट जाँच गरी पुनः प्रयास गर्नुहोस्।'
            : 'Unable to retrieve details for this complaint. Please verify your connection and try again.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="citizen-primary small-btn"
            onClick={loadComplaint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} />
            {isNe ? 'पुनः प्रयास' : 'Retry'}
          </button>
          <button
            type="button"
            className="citizen-secondary small-btn"
            onClick={onBack}
          >
            {isNe ? 'फर्कनुहोस्' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const stages = [
    ['pending', isNe ? 'उजुरी दर्ता भयो' : 'Complaint Submitted'],
    ['verified', isNe ? 'इन्जिनियरिङ समीक्षा' : 'Under Engineering Review'],
    ['in_progress', isNe ? 'मर्मत कार्य प्रगतिमा' : 'Work in Progress'],
    ['resolved', isNe ? 'समाधान भयो' : 'Resolved'],
  ];

  const reached = (complaint.updates || []).map((update) => update.new_status).filter(Boolean);
  const stopped = ['rejected', 'withdrawn'].includes(complaint.status);
  const needsMoreInfo = complaint.status === 'more_information_needed';

  return (
    <div className="complaint-detail">
      <div className="citizen-page-heading">
        <div>
          <p>{isNe ? 'ट्र्याकिङ कोड' : 'Tracking Code'}</p>
          <h1>{complaint.complaint_number}</h1>
        </div>
        <StatusBadge status={complaint.status} lang={lang} />
      </div>

      {error && <p className="citizen-message error">{error}</p>}

      {/* Action Required Banner for more_information_needed */}
      {needsMoreInfo && (
        <section
          className="citizen-card"
          style={{ background: '#fefce8', border: '1px solid #fde047', marginBottom: '16px' }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 4px', color: '#854d0e', fontSize: '15px', fontWeight: 700 }}>
                {isNe
                  ? 'नगरपालिकाबाट थप जानकारी अनुरोध गरिएको छ'
                  : 'Municipal Action Required: Additional Information Needed'}
              </h3>
              <p style={{ margin: '0 0 8px', color: '#713f12', fontSize: '13.5px', lineHeight: 1.5 }}>
                {complaint.official_response ||
                  (isNe
                    ? 'नगरपालिका प्राविधिक टोलीले स्थलगत निरीक्षणका लागि थप विवरण उपलब्ध गराउन अनुरोध गरेको छ।'
                    : 'Municipal engineering staff reviewed your report and requested further details to conduct on-site verification.')}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Progress Timeline */}
      <section className="citizen-card live-timeline-card">
        <h2>{isNe ? 'प्रत्यक्ष नगरपालिका प्रगति' : 'Live Municipal Response Timeline'}</h2>
        {stopped ? (
          <div className="live-stop-state">
            <AlertTriangle size={24} className="stop-icon" />
            <div>
              <StatusBadge status={complaint.status} lang={lang} />
              <p>
                {complaint.status === 'withdrawn'
                  ? (isNe ? 'यो उजुरी नागरिकद्वारा फिर्ता लिइएको छ।' : 'This complaint was withdrawn by the resident.')
                  : (isNe ? 'यो उजुरी नगरपालिका प्राविधिकद्वारा समीक्षा भई बन्द गरिएको छ।' : 'This complaint was reviewed and closed/rejected by municipal authorities.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="live-progress">
            {stages.map(([status, label], index) => {
              const isPassed = reached.includes(status) || complaint.status === status;
              const isCurrent = complaint.status === status;
              return (
                <div key={status} className={`stage-step ${isPassed ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-marker">
                    {isPassed ? <CheckCircle2 size={16} /> : <span>{index + 1}</span>}
                  </div>
                  <div className="step-info">
                    <strong>{label}</strong>
                    {isCurrent && <span className="current-indicator">{isNe ? 'हालको स्थिति' : 'Current Stage'}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Details */}
      <section className="citizen-card">
        <h2>{complaint.title}</h2>
        <div className="complaint-summary-meta">
          <span>
            <MapPin size={14} /> {complaint.village?.name || 'Village'}, W{complaint.ward_number}
          </span>
          <span>
            <Calendar size={14} /> {new Date(complaint.submitted_at || complaint.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="complaint-description">{complaint.description}</p>

        {/* Audio Recording Playback if available */}
        {complaint.audio_path && (
          <div className="citizen-audio-box" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Volume2 size={18} color="#123D30" />
              <strong>{isNe ? 'रेकर्ड गरिएको नागरिक आवाज' : 'Recorded Citizen Voice'}</strong>
            </div>
            <audio controls src={`/storage/${complaint.audio_path}`} style={{ width: '100%' }} />
          </div>
        )}

        {/* Withdraw Action */}
        {!stopped && complaint.status === 'pending' && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="citizen-secondary danger small-btn"
              onClick={withdraw}
              disabled={withdrawing}
            >
              {withdrawing
                ? (isNe ? 'प्रक्रिया हुँदैछ...' : 'Processing...')
                : (isNe ? 'उजुरी फिर्ता लिनुहोस्' : 'Withdraw Complaint')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
