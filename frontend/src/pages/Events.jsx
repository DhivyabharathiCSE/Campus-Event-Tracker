import { useEffect, useState, useCallback } from 'react';
import { Search, X, CalendarX } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import EventCard from '../components/EventCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { CATEGORIES, STATUSES } from '../utils/dateUtils';

export default function Events() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [myEventIds, setMyEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const [filters, setFilters] = useState({ search: '', category: '', status: '', date: '', venue: '' });

  const loadMyEvents = useCallback(async () => {
    try {
      const res = await api.get('/my-events');
      setMyEventIds(new Set(res.data.data.events.map((e) => e.id)));
    } catch {
      // ignore — not critical for rendering the list
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/events', { params });
      setEvents(res.data.data.events);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]); // eslint-disable-line

  useEffect(() => { loadMyEvents(); }, [loadMyEvents]);
  useEffect(() => {
    const t = setTimeout(loadEvents, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [loadEvents]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ search: '', category: '', status: '', date: '', venue: '' });
  }

  async function handleRegister(event) {
    setBusyId(event.id);
    try {
      await api.post(`/events/${event.id}/register`);
      showToast(`Registered for ${event.title}.`, 'success');
      setMyEventIds((prev) => new Set(prev).add(event.id));
      loadEvents();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmCancel() {
    const event = cancelTarget;
    setCancelTarget(null);
    setBusyId(event.id);
    try {
      await api.delete(`/events/${event.id}/register`);
      showToast(`Registration cancelled for ${event.title}.`, 'success');
      setMyEventIds((prev) => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
      loadEvents();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            className="input" placeholder="Search events..."
            value={filters.search} onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select className="input" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="input" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" className="input" value={filters.date} onChange={(e) => updateFilter('date', e.target.value)} />
        </div>
        <div className="field">
          <label>Venue</label>
          <input className="input" placeholder="Any venue" value={filters.venue} onChange={(e) => updateFilter('venue', e.target.value)} />
        </div>
        {hasActiveFilters && (
          <button className="btn btn-outline" onClick={clearFilters}><X size={14} /> Clear Filters</button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading events..." />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarX} title="No events found" message="Try adjusting your search or filters." />
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered={myEventIds.has(event.id)}
              registering={busyId === event.id}
              onRegister={handleRegister}
              onCancel={(e) => setCancelTarget(e)}
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
