import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Clock, CheckCircle2, Users, ClipboardList, TrendingUp, ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatTime } from '../utils/dateUtils';

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/admin/stats');
        if (!mounted) return;
        setStats(res.data.data.stats);
        setRecentEvents(res.data.data.recentEvents);
        setUpcomingEvents(res.data.data.upcomingEvents);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []); // eslint-disable-line

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  const cards = [
    { label: 'Total Events', value: stats.totalEvents, icon: CalendarDays, bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Clock, bg: 'var(--color-warning-bg)', color: 'var(--color-accent-dark)' },
    { label: 'Ongoing Events', value: stats.ongoingEvents, icon: TrendingUp, bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    { label: 'Completed Events', value: stats.completedEvents, icon: CheckCircle2, bg: '#eef0f4', color: 'var(--color-text-muted)' },
    { label: 'Total Students', value: stats.totalStudents, icon: Users, bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
    { label: 'Total Registrations', value: stats.totalRegistrations, icon: ClipboardList, bg: 'var(--color-warning-bg)', color: 'var(--color-accent-dark)' },
  ];

  return (
    <div>
      <div className="page-header"><h1>Admin Dashboard</h1></div>

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}><c.icon size={22} /></div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card card-pad">
          <div className="section-title">
            <h2>Recent Events</h2>
            <Link to="/admin/events" className="btn btn-ghost btn-sm">Manage all <ArrowRight size={14} /></Link>
          </div>
          {recentEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No events yet" message="Create your first event to get started." />
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Event</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {recentEvents.map((e) => (
                    <tr key={e.id}>
                      <td>{e.title}</td>
                      <td>{formatDate(e.event_date)}</td>
                      <td><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-title"><h2>Upcoming Events</h2></div>
          {upcomingEvents.length === 0 ? (
            <EmptyState icon={Clock} title="Nothing scheduled" message="No upcoming events at the moment." />
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>Event</th><th>Date</th><th>Registrations</th></tr></thead>
                <tbody>
                  {upcomingEvents.map((e) => (
                    <tr key={e.id}>
                      <td>{e.title}</td>
                      <td>{formatDate(e.event_date)}, {formatTime(e.start_time)}</td>
                      <td>{e.registration_count} / {e.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
