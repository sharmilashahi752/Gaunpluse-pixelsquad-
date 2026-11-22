import React, { useEffect, useState } from 'react';
import { citizenService } from './citizenApi';
import { Bell, CheckCircle, Info } from 'lucide-react';

export default function NotificationsPage({ onNavigate, onViewComplaint, lang = 'ne' }) {
  const [notifications, setNotifications] = useState({ data: [] });
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await citizenService.getNotifications();
      setNotifications(data.notifications || data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
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

  return (
    <div className="citizen-page">
      <div className="citizen-page-heading">
        <div>
          <p>Citizen Alerts & Notices</p>
          <h1>Official Notifications</h1>
          <span>Live updates from municipal engineers and ward representatives regarding your submitted issues.</span>
        </div>
      </div>

      <section className="citizen-card">
        {loading ? (
          <div className="citizen-loading-inner">Loading notifications...</div>
        ) : notifications.data.length === 0 ? (
          <div className="empty-state-box">
            <Bell size={32} className="empty-icon" />
            <p className="citizen-empty">No notifications yet. You will receive real-time alerts when your complaints are reviewed or resolved.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.data.map((item) => (
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
                    {!item.read_at && <span className="unread-dot">New</span>}
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
                        View Linked Complaint
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
