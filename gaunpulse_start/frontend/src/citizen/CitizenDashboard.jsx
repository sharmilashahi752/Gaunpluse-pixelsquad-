import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import StatusBadge from './StatusBadge';
import { translations } from './citizenI18n';
import {
  FileText,
  Clock,
  PlayCircle,
  CheckCircle,
  ArrowRight,
  PlusCircle,
  Bell,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function CitizenDashboard({ onNavigate, onViewComplaint, lang = 'ne' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t = translations[lang] || translations.ne;

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await citizenService.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(
        err.response?.data?.message ||
          (lang === 'ne'
            ? 'तथ्यांक लोड गर्न सकिएन। कृपया इन्टरनेट जाँच गरी पुनः प्रयास गर्नुहोस्।'
            : 'Unable to load dashboard data. Please verify your connection and try again.')
      );
      // Fallback empty stats to preserve layout and prevent blank screen
      setStats({
        total_complaints: 0,
        pending_complaints: 0,
        in_progress_complaints: 0,
        resolved_complaints: 0,
        recent_complaints: [],
        recent_notifications: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const complaintButtonLabel = lang === 'ne' ? 'उजुरी दर्ता गर्नुहोस्' : 'File a complaint';

  return (
    <div className="citizen-page">
      {/* Page Header with Compact Complaint Button */}
      <div
        className="citizen-page-heading"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#092d22',
              lineHeight: 1.2,
            }}
          >
            Overview
          </h1>
        </div>

        {/* Top File a complaint Button */}
        <button
          type="button"
          className="citizen-complaint-top-btn"
          onClick={() => onNavigate('submit')}
          aria-label={complaintButtonLabel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '42px',
            padding: '10px 18px',
            borderRadius: '8px',
            backgroundColor: '#173D32',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(23, 61, 50, 0.2)',
            transition: 'background-color 0.18s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#215445';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#173D32';
          }}
        >
          <PlusCircle size={16} stroke="#FFFFFF" color="#FFFFFF" strokeWidth={2.2} />
          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{complaintButtonLabel}</span>
        </button>
      </div>

      {/* Recoverable Network Error Notice */}
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
            marginBottom: '20px',
            color: '#9a3412',
            fontSize: '13px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#c2410c" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> {lang === 'ne' ? 'पुनः प्रयास गर्नुहोस्' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats && (
        <div className="citizen-loading" style={{ padding: '36px', textAlign: 'center', color: '#176342' }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 10px' }} />
          <p style={{ margin: 0 }}>{t.loading || 'Loading citizen dashboard...'}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="citizen-stats" style={{ marginBottom: '24px' }}>
            <article>
              <div className="stat-icon-wrap all">
                <FileText size={20} />
              </div>
              <div>
                <span>{lang === 'ne' ? 'कुल उजुरीहरू' : 'Total Complaints'}</span>
                <strong>{stats.total_complaints ?? 0}</strong>
              </div>
            </article>
            <article>
              <div className="stat-icon-wrap pending">
                <Clock size={20} />
              </div>
              <div>
                <span>{lang === 'ne' ? 'प्रमाणीकरण हुन बाँकी' : 'Authentication Pending'}</span>
                <strong>{stats.pending_complaints ?? 0}</strong>
              </div>
            </article>
            <article>
              <div className="stat-icon-wrap progress">
                <PlayCircle size={20} />
              </div>
              <div>
                <span>{lang === 'ne' ? 'कार्य प्रगतिमा' : 'Work in Progress'}</span>
                <strong>{stats.in_progress_complaints ?? 0}</strong>
              </div>
            </article>
            <article>
              <div className="stat-icon-wrap resolved">
                <CheckCircle size={20} />
              </div>
              <div>
                <span>{lang === 'ne' ? 'समाधान भएको' : 'Resolved'}</span>
                <strong>{stats.resolved_complaints ?? 0}</strong>
              </div>
            </article>
          </div>

          {/* Recent Reports Section */}
          <section className="citizen-card" style={{ marginBottom: '24px' }}>
            <div className="card-header-flex">
              <h2>{lang === 'ne' ? 'हालैका उजुरीहरू' : 'Your Recent Reports'}</h2>
              <button type="button" className="citizen-text-button" onClick={() => onNavigate('complaints')}>
                {lang === 'ne' ? 'सबै उजुरी हेर्नुहोस्' : 'View All Reports'} <ArrowRight size={14} />
              </button>
            </div>

            {Array.isArray(stats.recent_complaints) && stats.recent_complaints.length > 0 ? (
              <div className="citizen-table-wrap">
                <table className="citizen-table">
                  <thead>
                    <tr>
                      <th>{lang === 'ne' ? 'ट्र्याकिङ कोड' : 'Tracking ID'}</th>
                      <th>{lang === 'ne' ? 'शीर्षक' : 'Title'}</th>
                      <th>{lang === 'ne' ? 'प्रकार' : 'Category'}</th>
                      <th>{lang === 'ne' ? 'गाउँ / वडा' : 'Village / Ward'}</th>
                      <th>{lang === 'ne' ? 'अवस्था' : 'Status'}</th>
                      <th>{lang === 'ne' ? 'कार्य' : 'Action'}</th>
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
                          {item.village?.name || item.settlement_name || 'Village'}{' '}
                          {item.ward_number ? `(Ward ${item.ward_number})` : ''}
                        </td>
                        <td>
                          <StatusBadge status={item.status} lang={lang} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="citizen-text-button"
                            onClick={() => {
                              onViewComplaint?.(item.id);
                              onNavigate('complaints');
                            }}
                          >
                            {lang === 'ne' ? 'प्रगति हेर्नुहोस्' : 'Track Progress'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box" style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p className="citizen-empty" style={{ margin: '0 0 14px', color: '#687c73', fontSize: '13.5px' }}>
                  {lang === 'ne'
                    ? 'तपाईंले अहिलेसम्म कुनै पूर्वाधार सम्बन्धी उजुरी दर्ता गर्नुभएको छैन।'
                    : 'You have not submitted any infrastructure reports yet.'}
                </p>
                <button
                  type="button"
                  className="citizen-primary"
                  onClick={() => onNavigate('submit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#123D30',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                  }}
                >
                  <PlusCircle size={16} />
                  <span>{lang === 'ne' ? 'पहिलो उजुरी दर्ता गर्नुहोस्' : 'Submit Your First Report'}</span>
                </button>
              </div>
            )}
          </section>

          {/* Recent Notices Section */}
          {Array.isArray(stats.recent_notifications) && stats.recent_notifications.length > 0 && (
            <section className="citizen-card" style={{ marginBottom: '24px' }}>
              <div className="card-header-flex">
                <h2>{lang === 'ne' ? 'हालैका सरकारी सूचना तथा अपडेट' : 'Recent Government Notices'}</h2>
                <button type="button" className="citizen-text-button" onClick={() => onNavigate('notifications')}>
                  <Bell size={14} /> {lang === 'ne' ? 'सबै सूचनाहरू' : 'All Notices'}
                </button>
              </div>
              <div className="notification-mini-list">
                {stats.recent_notifications.map((notif) => (
                  <article key={notif.id} className="notification-mini-item">
                    <div className="notif-content">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                    </div>
                    <small>{notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Recent'}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
