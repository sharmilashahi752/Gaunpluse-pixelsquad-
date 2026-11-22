import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import { Bell, CheckCircle, Info, AlertCircle, RefreshCw } from 'lucide-react';

export default function NotificationsPage({ onNavigate, onViewComplaint, lang = 'ne' }) {
  const [notifications, setNotifications] = useState({ data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isNe = lang === 'ne';

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const data = await citizenService.getNotifications();
      setNotifications(data || { data: [] });
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(
        err.response?.data?.message ||
          (isNe
            ? 'सूचनाहरू लोड गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।'
            : 'Unable to load notifications. Please check your connection and retry.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(notification) {
    if (notification.read_at) return;
    try {
      await citizenService.markNotificationRead(notification.id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  }

  // Safely extract notification list from various response formats
  const notifList = Array.isArray(notifications)
    ? notifications
    : Array.isArray(notifications?.data)
    ? notifications.data
    : Array.isArray(notifications?.notifications?.data)
    ? notifications.notifications.data
    : Array.isArray(notifications?.notifications)
    ? notifications.notifications
    : [];

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>{isNe ? 'नागरिक सतर्कता र सूचना' : 'Citizen Alerts & Notices'}</p>
          <h1>{isNe ? 'आधिकारिक सूचनाहरू' : 'Official Notifications'}</h1>
          <span>
            {isNe
              ? 'तपाईंले दर्ता गरेका उजुरीहरूमा वडा प्राविधिक तथा नगरपालिकाबाट प्राप्त प्रत्यक्ष अपडेटहरू।'
              : 'Live updates from municipal engineers and ward representatives regarding your submitted issues.'}
          </span>
        </div>
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
            onClick={loadNotifications}
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
            {isNe ? 'सूचनाहरू लोड हुँदैछ...' : 'Loading notifications...'}
          </div>
        ) : notifList.length === 0 ? (
          <div className="empty-state-box">
            <Bell size={32} className="empty-icon" />
            <p className="citizen-empty">
              {isNe
                ? 'अहिले कुनै सूचना छैन। तपाईंको उजुरी समीक्षा वा समाधान भएपछि यहाँ प्रत्यक्ष सन्देश देखिनेछ।'
                : 'No notifications yet. You will receive real-time alerts when your complaints are reviewed or resolved.'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifList.map((item) => (
              <article
                className={`citizen-notification-item ${!item.read_at ? 'unread' : ''}`}
                key={item.id}
                onClick={() => markAsRead(item)}
              >
                <div className="notif-badge">
                  <Info size={18} />
                </div>
                <div className="notif-body">
                  <div className="notif-header">
                    <strong>{item.title}</strong>
                    {!item.read_at && <span className="unread-dot">{isNe ? 'नयाँ' : 'New'}</span>}
                  </div>
                  <p>{item.message}</p>
                  <div className="notif-meta">
                    <small>{new Date(item.created_at).toLocaleString()}</small>
                    {item.complaint_id && (
                      <button
                        type="button"
                        className="citizen-text-button small-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewComplaint?.(item.complaint_id);
                          onNavigate?.('complaints');
                        }}
                      >
                        {isNe ? 'सम्बन्धित उजुरी हेर्नुहोस्' : 'View Linked Complaint'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
