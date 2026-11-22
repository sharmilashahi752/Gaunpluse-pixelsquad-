import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import StatusBadge from './StatusBadge';
import { FileText, Clock, PlayCircle, CheckCircle, ArrowRight, PlusCircle, Bell } from 'lucide-react';

export default function CitizenDashboard({ onNavigate, onViewComplaint }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    citizenService
      .getDashboard()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="citizen-loading">Loading citizen dashboard...</div>;
  if (!stats) return <div className="citizen-loading">Unable to load dashboard data. Please try again.</div>;

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>Citizen Portal</p>
          <h1>Community Infrastructure Feedback</h1>
          <span>Report hazards, damaged roads, broken water taps, and track municipal repairs live.</span>
        </div>
        <button type="button" className="citizen-primary" onClick={() => onNavigate('submit')}>
          <PlusCircle size={16} /> File New Complaint
        </button>
      </div>

      <div className="citizen-stats">
        <article>
          <div className="stat-icon-wrap all">
            <FileText size={20} />
          </div>
          <div>
            <span>Total Reports</span>
            <strong>{stats.total_complaints}</strong>
          </div>
        </article>
        <article>
          <div className="stat-icon-wrap pending">
            <Clock size={20} />
          </div>
          <div>
            <span>Pending Review</span>
            <strong>{stats.pending_complaints}</strong>
          </div>
        </article>
        <article>
          <div className="stat-icon-wrap progress">
            <PlayCircle size={20} />
          </div>
          <div>
            <span>Work In Progress</span>
            <strong>{stats.in_progress_complaints}</strong>
          </div>
        </article>
        <article>
          <div className="stat-icon-wrap resolved">
            <CheckCircle size={20} />
          </div>
          <div>
            <span>Resolved</span>
            <strong>{stats.resolved_complaints}</strong>
          </div>
        </article>
      </div>

      <section className="citizen-card">
        <div className="card-header-flex">
          <h2>Your Recent Reports</h2>
          <button type="button" className="citizen-text-button" onClick={() => onNavigate('complaints')}>
            View All Reports <ArrowRight size={14} />
          </button>
        </div>

        {stats.recent_complaints && stats.recent_complaints.length > 0 ? (
          <div className="citizen-table-wrap">
            <table className="citizen-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Village / Ward</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_complaints.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code className="tracking-code-pill">{item.complaint_number}</code>
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      {item.village?.name || 'Village'} {item.ward_number ? `(Ward ${item.ward_number})` : ''}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="citizen-text-button"
                        onClick={() => {
                          onViewComplaint(item.id);
                          onNavigate('complaints');
                        }}
                      >
                        Track Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-box">
            <p className="citizen-empty">You have not submitted any infrastructure reports yet.</p>
            <button type="button" className="citizen-primary" onClick={() => onNavigate('submit')}>
              Submit Your First Report
            </button>
          </div>
        )}
      </section>

      {stats.recent_notifications && stats.recent_notifications.length > 0 && (
        <section className="citizen-card">
          <div className="card-header-flex">
            <h2>Recent Updates & Notices</h2>
            <button type="button" className="citizen-text-button" onClick={() => onNavigate('notifications')}>
              <Bell size={14} /> All Notifications
            </button>
          </div>
          <div className="notification-mini-list">
            {stats.recent_notifications.map((notif) => (
              <article key={notif.id} className="notification-mini-item">
                <div className="notif-content">
                  <strong>{notif.title}</strong>
                  <p>{notif.message}</p>
                </div>
                <small>{new Date(notif.created_at).toLocaleDateString()}</small>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
