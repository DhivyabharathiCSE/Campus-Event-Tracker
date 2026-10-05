import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, CalendarDays, CheckCircle2, Bell, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatTime, timeAgo } from '../utils/dateUtils';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [notifPreview, setNotifPreview] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [statsRes, notifRes] = await Promise.all([
          api.get('/student/stats'),
          api.get('/notifications'),
        ]);
        if (!mounted) return;
        setStats(statsRes.data.data.stats);
        setUpcoming(statsRes.data.data.upcomingEvents);
        setRecent(statsRes.data.data.recentlyRegistered);
        setNotifPreview(notifRes.data.data.notifications.slice(0, 4));
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []); // eslint-disable-line

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  const cards = [
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: CalendarClock, bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
    { label: 'My Registrations', value: stats.myRegistrations, icon: ClipboardCheck, bg: 'var(--color-warning-bg)', color: 'var(--color-accent-dark)' },
    { label: "Today's Events", value: stats.todaysEvents, icon: CalendarDays, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    { label: 'Completed Events', value: stats.completedEvents, icon: CheckCircle2, bg: '#eef0f4', color: 'var(--color-text-muted)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user.name.split(' ')[0]}</h1>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
              <c.icon size={22} />
            </div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <div className="card card-pad">
          <div className="section-title">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No upcoming events" message="Browse events and register to see them here." />
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Status</th></tr></thead>
                <tbody>
                  {upcoming.map((e) => (
                    <tr key={e.id}>
                      <td><Link to={`/events/${e.id}`}>{e.title}</Link></td>
                      <td>{formatDate(e.event_date)}, {formatTime(e.start_time)}</td>
                      <td>{e.venue}</td>
                      <td><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="section-title mt-24">
            <h2>Recently Registered</h2>
          </div>
          {recent.length === 0 ? (
            <p className="text-muted">You haven't registered for any events yet.</p>
          ) : (
            <div className="event-grid">
              {recent.slice(0, 2).map((e) => (
                <Link to={`/events/${e.id}`} key={e.id} className="card card-pad" style={{ display: 'block', textDecoration: 'none' }}>
                  <div className="event-card-category">{e.category}</div>
                  <h3 style={{ margin: '8px 0 4px' }}>{e.title}</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                    {formatDate(e.event_date)} · {e.venue}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-title">
            <h2>Notifications</h2>
            <Link to="/notifications" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          {notifPreview.length === 0 ? (
            <EmptyState icon={Bell} title="All caught up" message="You have no notifications." />
          ) : (
            <div>
              {notifPreview.map((n) => (
                <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} style={{ padding: '12px 0' }}>
                  <div className="notif-icon"><Bell size={16} /></div>
                  <div>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
