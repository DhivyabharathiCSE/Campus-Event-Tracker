import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import EventCard from '../components/EventCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MyEvents() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/my-events');
      setEvents(res.data.data.events);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleConfirmCancel() {
    const event = cancelTarget;
    setCancelTarget(null);
    setBusyId(event.id);
    try {
      await api.delete(`/events/${event.id}/register`);
      showToast(`Registration cancelled for ${event.title}.`, 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingSpinner label="Loading your events..." />;

  return (
    <div>
      <div className="page-header"><h1>My Events</h1></div>

      {events.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No registrations yet" message="Browse the events page to find something to join." />
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered
              registering={busyId === event.id}
              onCancel={(e) => setCancelTarget(e)}
              onRegister={() => {}}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel registration?"
        message={`Are you sure you want to cancel your registration for "${cancelTarget?.title}"?`}
        confirmLabel="Yes, cancel"
        danger
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
