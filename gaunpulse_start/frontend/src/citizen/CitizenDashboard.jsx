import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import StatusBadge from './StatusBadge';
import { translations } from './citizenI18n';
import { FileText, Clock, PlayCircle, CheckCircle, ArrowRight, PlusCircle, Bell } from 'lucide-react';

export default function CitizenDashboard({ onNavigate, onViewComplaint, lang = 'ne' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = translations[lang] || translations.ne;

  useEffect(() => {
    citizenService
      .getDashboard()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="citizen-loading">{t.loading || 'Loading citizen dashboard...'}</div>;
  }
  if (!stats) {
    return (
      <div className="citizen-loading">
        {lang === 'ne' ? 'तथ्यांक लोड गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।' : 'Unable to load dashboard data. Please try again.'}
      </div>
    );
  }

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>{t.brandSubtitle || 'Citizen Service Portal'}</p>
          <h1>{lang === 'ne' ? 'नागरिक पूर्वाधार सहायता केन्द्र' : 'Community Infrastructure Feedback'}</h1>
          <span>
            {lang === 'ne'
              ? 'सडक, पुल, खानेपानी र आपतकालीन जोखिमहरूको रिपोर्ट गर्नुहोस् र मर्मत कार्यको प्रत्यक्ष प्रगति ट्र्याक गर्नुहोस्।'
              : 'Report hazards, damaged roads, broken water taps, and track municipal repairs live.'}
          </span>
        </div>
        <button
          type="button"
          className="citizen-primary"
          onClick={() => onNavigate('submit')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            background: '#123D30',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <PlusCircle size={16} /> {t.reportIncident || 'File New Complaint'}
        </button>
      </div>

      <div className="citizen-stats">
        <article>
          <div className="stat-icon-wrap all">
            <FileText size={20} />
          </div>
          <div>
            <span>{lang === 'ne' ? 'कुल उजुरीहरू' : 'Total Reports'}</span>
            <strong>{stats.total_complaints}</strong>
          </div>
        </article>
        <article>
          <div className="stat-icon-wrap pending">
            <Clock size={20} />
          </div>
          <div>
            <span>{lang === 'ne' ? 'प्रमाणीकरण हुन बाँकी' : 'Pending Review'}</span>
            <strong>{stats.pending_complaints}</strong>
          </div>
        </article>
        <article>
          <div className="stat-icon-wrap progress">
            <PlayCircle size={20} />
          </div>
          <div>
            <span>{lang === 'ne' ? 'कार्य प्रगतिमा' : 'Work In Progress'}</span>
            <strong>{stats.in_progress_complaints}</strong>
          </div>
        </article>
        <article>
          <div className="stat-icon-wrap resolved">
            <CheckCircle size={20} />
          </div>
          <div>
            <span>{lang === 'ne' ? 'समाधान भएको' : 'Resolved'}</span>
            <strong>{stats.resolved_complaints}</strong>
          </div>
        </article>
      </div>

      <section className="citizen-card">
        <div className="card-header-flex">
          <h2>{lang === 'ne' ? 'हालैका उजुरीहरू' : 'Your Recent Reports'}</h2>
          <button type="button" className="citizen-text-button" onClick={() => onNavigate('complaints')}>
            {lang === 'ne' ? 'सबै उजुरी हेर्नुहोस्' : 'View All Reports'} <ArrowRight size={14} />
          </button>
        </div>

        {stats.recent_complaints && stats.recent_complaints.length > 0 ? (
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
                          onViewComplaint(item.id);
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
          <div className="empty-state-box">
            <p className="citizen-empty">
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
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#123D30',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {lang === 'ne' ? 'पहिलो उजुरी दर्ता गर्नुहोस्' : 'Submit Your First Report'}
            </button>
          </div>
        )}
      </section>

      {stats.recent_notifications && stats.recent_notifications.length > 0 && (
        <section className="citizen-card" style={{ marginTop: '20px' }}>
          <div className="card-header-flex">
            <h2>{lang === 'ne' ? 'हालैका सरकारी सूचना तथा अपडेट' : 'Recent Updates & Notices'}</h2>
            <button type="button" className="citizen-text-button" onClick={() => onNavigate('notifications')}>
              <Bell size={14} /> {lang === 'ne' ? 'सबै सूचनाहरू' : 'All Notifications'}
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
