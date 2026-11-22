import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import StatusBadge from './StatusBadge';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2, MessageSquare, MapPin, Calendar, Volume2 } from 'lucide-react';

export default function MyComplaints({ selectedComplaintId, onSelectComplaint, lang = 'ne' }) {
  const [complaints, setComplaints] = useState({ data: [] });
  const [filters, setFilters] = useState({ search: '', status: 'all', category: 'all' });
  const [selectedId, setSelectedId] = useState(selectedComplaintId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedComplaintId) {
      setSelectedId(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  async function loadComplaints() {
    setLoading(true);
    try {
      const data = await citizenService.getComplaints(filters);
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [filters.search, filters.status, filters.category]);

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
        >
          <ArrowLeft size={16} /> Back to My Complaints
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
          <p>Citizen Service History</p>
          <h1>My Infrastructure Reports</h1>
          <span>View past complaints, track engineering progress, and read municipal responses.</span>
        </div>
      </div>

      <div className="complaint-filters">
        <input
          placeholder="Search by ID or description keyword..."
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="verified">Verified</option>
          <option value="more_information_needed">Action Needed (More Info)</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        >
          <option value="all">All Categories</option>
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

      <section className="citizen-card">
        {loading ? (
          <div className="citizen-loading-inner">Loading reports...</div>
        ) : complaints.data.length === 0 ? (
          <p className="citizen-empty">No infrastructure reports match the selected filters.</p>
        ) : (
          <div className="citizen-table-wrap">
            <table className="citizen-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Ward / Village</th>
                  <th>Date Filed</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.data.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>
                      <code className="tracking-code-pill">{complaint.complaint_number}</code>
                    </td>
                    <td>
                      <strong>{complaint.title}</strong>
                    </td>
                    <td>{complaint.category}</td>
                    <td>
                      {complaint.village?.name || 'Village'} {complaint.ward_number ? `(W${complaint.ward_number})` : ''}
                    </td>
                    <td>{new Date(complaint.submitted_at || complaint.created_at).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={complaint.status} lang={lang} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="citizen-primary small-btn"
                        onClick={() => setSelectedId(complaint.id)}
                      >
                        View & Track
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

function ComplaintDetails({ complaintId, onUpdated, lang = 'ne' }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  async function loadComplaint() {
    setLoading(true);
    try {
      const response = await citizenService.getComplaint(complaintId);
      setComplaint(response.complaint);
      setError('');
      onUpdated?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Complaint details could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  async function withdraw() {
    if (!window.confirm('Are you sure you want to withdraw this complaint? This cannot be undone.')) return;
    setWithdrawing(true);
    try {
      await citizenService.withdrawComplaint(complaintId);
      await loadComplaint();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw complaint.');
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) return <div className="citizen-loading-inner">Loading live complaint status...</div>;
  if (!complaint) return <div className="citizen-empty">Complaint not found.</div>;

  const stages = [
    ['pending', 'Complaint Submitted'],
    ['verified', 'Under Engineering Review'],
    ['in_progress', 'Work in Progress'],
    ['resolved', 'Resolved'],
  ];

  const reached = (complaint.updates || []).map((update) => update.new_status).filter(Boolean);
  const stopped = ['rejected', 'withdrawn'].includes(complaint.status);
  const needsMoreInfo = complaint.status === 'more_information_needed';

  return (
    <div className="complaint-detail">
      <div className="citizen-page-heading">
        <div>
          <p>Tracking Code</p>
          <h1>{complaint.complaint_number}</h1>
        </div>
        <StatusBadge status={complaint.status} lang={lang} />
      </div>

      {error && <p className="citizen-message error">{error}</p>}

      {/* Action Required Banner for more_information_needed */}
      {needsMoreInfo && (
        <section className="citizen-card" style={{ background: '#fefce8', border: '1px solid #fde047', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 4px', color: '#854d0e', fontSize: '15px', fontWeight: 700 }}>
                Municipal Action Required: Additional Information Needed
              </h3>
              <p style={{ margin: '0 0 8px', color: '#713f12', fontSize: '13.5px', lineHeight: 1.5 }}>
                {complaint.official_response || 'Municipal engineering staff reviewed your report and requested further details to conduct on-site verification.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Progress Timeline */}
      <section className="citizen-card live-timeline-card">
        <h2>Live Municipal Response Timeline</h2>
        {stopped ? (
          <div className="live-stop-state">
            <AlertTriangle size={24} className="stop-icon" />
            <div>
              <StatusBadge status={complaint.status} lang={lang} />
              <p>
                {complaint.status === 'withdrawn'
                  ? 'This complaint was withdrawn by the resident.'
                  : 'This complaint was reviewed and closed/rejected by municipal authorities.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="live-progress">
            {stages.map(([status, label], index) => {
              const completed = reached.includes(status) || complaint.status === status;
              const current = complaint.status === status;
              return (
                <article
                  key={status}
                  className={`${completed ? 'completed' : ''} ${current ? 'current' : ''}`}
                >
                  <span>{completed ? '✓' : index + 1}</span>
                  <div>
                    <strong>{label}</strong>
                    <small>{current ? 'Current Status' : completed ? 'Completed' : 'Pending'}</small>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Official Response Banner if available */}
      {complaint.official_response && !needsMoreInfo && (
        <section className="citizen-card official-response-card">
          <div className="card-header-flex">
            <h2>
              <MessageSquare size={18} /> Official Municipal Response
            </h2>
          </div>
          <p className="response-body">{complaint.official_response}</p>
        </section>
      )}

      {/* Core Complaint Information Grid */}
      <section className="citizen-card complaint-detail-grid">
        <article>
          <span>Title</span>
          <strong>{complaint.title}</strong>
        </article>
        <article>
          <span>Category</span>
          <strong>{complaint.category === 'Other' ? complaint.custom_category : complaint.category}</strong>
        </article>
        <article>
          <span>Ward Number</span>
          <strong>Ward {complaint.ward_number || 'N/A'}</strong>
        </article>
        <article>
          <span>Village / Settlement</span>
          <strong>{complaint.settlement_name || complaint.village?.name || 'Local Ward Area'}</strong>
        </article>
        <article>
          <span>Submitted At</span>
          <strong>{new Date(complaint.submitted_at || complaint.created_at).toLocaleString()}</strong>
        </article>
        <article>
          <span>GPS Coordinates</span>
          <strong>
            {complaint.latitude && complaint.longitude
              ? `${complaint.latitude}, ${complaint.longitude}`
              : 'Auto-mapped'}
          </strong>
        </article>
      </section>

      {/* Description */}
      {complaint.description && (
        <section className="citizen-card form-section">
          <h2>Incident Description</h2>
          <p className="description-text">{complaint.description}</p>
        </section>
      )}

      {/* Voice Transcript if present */}
      {complaint.speech_transcript && (
        <section className="citizen-card form-section">
          <h2>Voice Note Transcription (Speech-to-Text)</h2>
          <p style={{
            margin: 0,
            padding: '12px 16px',
            background: '#f8fafc',
            borderLeft: '4px solid #123d30',
            borderRadius: '4px',
            fontStyle: 'italic',
            fontSize: '13.5px',
            color: '#1e293b',
            lineHeight: 1.6
          }}>
            "{complaint.speech_transcript}"
          </p>
        </section>
      )}

      {/* Attached Media (Photos and Audio) */}
      {complaint.media && complaint.media.length > 0 && (
        <section className="citizen-card form-section">
          <h2>Attached Evidence ({complaint.media.length} files)</h2>
          <div className="media-gallery-grid">
            {complaint.media.map((item) => {
              if (item.media_type === 'image') {
                const imgUrl = item.url || `/storage/${item.file_path}`;
                return (
                  <div key={item.id} className="media-gallery-item">
                    <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={imgUrl}
                        alt={item.original_name}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><text y="50%" x="50%" text-anchor="middle" font-size="10">Image</text></svg>';
                        }}
                      />
                    </a>
                    <span>{item.original_name}</span>
                  </div>
                );
              }
              if (item.media_type === 'audio') {
                const audioUrl = item.url || `/storage/${item.file_path}`;
                return (
                  <div key={item.id} className="audio-evidence-item">
                    <Volume2 size={20} />
                    <div style={{ width: '100%' }}>
                      <strong>Voice Complaint: {item.original_name}</strong>
                      <audio controls src={audioUrl} style={{ width: '100%', marginTop: '6px' }} />
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* Updates History */}
      <section className="citizen-card form-section">
        <h2>Audit & Action Log</h2>
        <div className="complaint-timeline">
          {(complaint.updates || []).map((update, index) => (
            <article key={update.id}>
              <span>{index + 1}</span>
              <div>
                <strong>{update.new_status ? update.new_status.replace('_', ' ').toUpperCase() : 'NOTE'}</strong>
                <p>{update.message}</p>
                <small>
                  {new Date(update.created_at).toLocaleString()}{' '}
                  {update.user?.name ? `• ${update.user.name}` : ''}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Withdraw Button if pending */}
      {['pending', 'verified'].includes(complaint.status) && (
        <div className="complaint-actions-bar">
          <button
            type="button"
            className="citizen-secondary danger"
            onClick={withdraw}
            disabled={withdrawing}
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw Complaint'}
          </button>
        </div>
      )}
    </div>
  );
}
