import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatTime, formatDateTime } from '../utils/dateUtils';

export default function AdminEventRegistrations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get(`/events/${id}/registrations`);
        if (!mounted) return;
        setEvent(res.data.data.event);
        setRegistrations(res.data.data.registrations);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]); // eslint-disable-line

  if (loading) return <LoadingSpinner label="Loading registrations..." />;
  if (!event) return null;

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/admin/events')}>
        <ArrowLeft size={16} /> Back to Events
      </button>

      <div className="page-header">
        <div>
          <h1>{event.title}</h1>
          <p className="text-muted" style={{ margin: 0 }}>
            {formatDate(event.event_date)} · {formatTime(event.start_time)}–{formatTime(event.end_time)} · {event.venue}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}><Users size={20} /></div>
          <div>
            <div className="stat-value">{registrations.length} / {event.capacity}</div>
            <div className="stat-label">Registered / Capacity</div>
          </div>
        </div>
      </div>

      {registrations.length === 0 ? (
        <EmptyState icon={Users} title="No registrations yet" message="No students have registered for this event." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Phone</th><th>Registered On</th></tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.registration_id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.department || '—'}</td>
                  <td>{r.year || '—'}</td>
                  <td>{r.phone || '—'}</td>
                  <td>{formatDateTime(r.registered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
