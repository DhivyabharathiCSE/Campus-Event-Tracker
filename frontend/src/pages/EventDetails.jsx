import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Users, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, formatTime, formatDateTime } from '../utils/dateUtils';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [eventRes, myEventsRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get('/my-events'),
      ]);
      setEvent(eventRes.data.data.event);
      setIsRegistered(myEventsRes.data.data.events.some((e) => e.id === Number(id)));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function handleRegister() {
    setBusy(true);
    try {
      await api.post(`/events/${id}/register`);
      showToast('Registered successfully.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setShowCancelConfirm(false);
    setBusy(true);
    try {
      await api.delete(`/events/${id}/register`);
      showToast('Registration cancelled.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading event..." />;
  if (!event) return null;

  const seatsLeft = event.capacity - event.registration_count;
  const isFull = seatsLeft <= 0;
  const canAct = event.status === 'upcoming' || event.status === 'ongoing';

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card card-pad" style={{ maxWidth: 720 }}>
        <div className="event-card-category">{event.category}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h1 style={{ marginBottom: 6 }}>{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-muted">{event.description || 'No description provided.'}</p>

        <div className="event-card-meta" style={{ fontSize: '0.92rem', gap: 12, margin: '20px 0' }}>
          <div><Calendar size={16} /> {formatDate(event.event_date)}</div>
          <div><Clock size={16} /> {formatTime(event.start_time)} – {formatTime(event.end_time)}</div>
          <div><MapPin size={16} /> {event.venue}</div>
          <div><User size={16} /> Organized by {event.organizer_name}</div>
          <div><Users size={16} /> {event.registration_count} / {event.capacity} registered ({Math.max(seatsLeft, 0)} seats left)</div>
        </div>

        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Registration deadline: {formatDateTime(event.registration_deadline)}
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {event.status === 'cancelled' ? (
            <button className="btn btn-outline" disabled>This event has been cancelled</button>
          ) : event.status === 'completed' ? (
            <button className="btn btn-outline" disabled>This event has ended</button>
          ) : isRegistered ? (
            <button className="btn btn-danger" onClick={() => setShowCancelConfirm(true)} disabled={busy}>
              Cancel Registration
            </button>
          ) : isFull ? (
            <button className="btn btn-outline" disabled>Registration Full</button>
          ) : canAct ? (
            <button className="btn btn-accent" onClick={handleRegister} disabled={busy}>
              {busy ? 'Registering...' : 'Register for this Event'}
            </button>
          ) : null}
          <Link to="/events" className="btn btn-outline">Browse More Events</Link>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel registration?"
        message={`Are you sure you want to cancel your registration for "${event.title}"?`}
        confirmLabel="Yes, cancel"
        danger
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
