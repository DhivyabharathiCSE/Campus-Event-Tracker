import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { timeAgo } from '../utils/dateUtils';

export default function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  if (loading) return <LoadingSpinner label="Loading notifications..." />;

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        {hasUnread && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${!n.is_read ? 'unread' : ''}`}
              style={{ cursor: n.is_read ? 'default' : 'pointer' }}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="notif-icon"><Bell size={16} /></div>
              <div>
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
