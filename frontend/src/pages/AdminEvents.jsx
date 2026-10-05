import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, Eye, Pencil, Trash2, Ban, PlusCircle, CalendarX } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { CATEGORIES, STATUSES, formatDate, formatTime } from '../utils/dateUtils';

export default function AdminEvents() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

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

  useEffect(() => {
    const t = setTimeout(loadEvents, 250);
    return () => clearTimeout(t);
  }, [loadEvents]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDelete() {
    const event = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/events/${event.id}`);
      showToast(`"${event.title}" deleted.`, 'success');
      loadEvents();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function handleCancelEvent() {
    const event = cancelTarget;
    setCancelTarget(null);
    try {
      await api.put(`/events/${event.id}`, { status: 'cancelled' });
      showToast(`"${event.title}" cancelled.`, 'success');
      loadEvents();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="page-header">
        <h1>Manage Events</h1>
        <Link to="/admin/events/create" className="btn btn-accent"><PlusCircle size={16} /> Create Event</Link>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input className="input" placeholder="Search events..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
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
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {hasActiveFilters && (
          <button className="btn btn-outline" onClick={() => setFilters({ search: '', category: '', status: '' })}>
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading events..." />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarX} title="No events found" message="Create a new event or adjust your filters." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th><th>Category</th><th>Date</th><th>Time</th><th>Venue</th>
                <th>Capacity</th><th>Registrations</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{e.category}</td>
                  <td>{formatDate(e.event_date)}</td>
                  <td>{formatTime(e.start_time)}</td>
                  <td>{e.venue}</td>
                  <td>{e.capacity}</td>
                  <td>
                    <Link to={`/admin/events/${e.id}/registrations`}>{e.registration_count}</Link>
                  </td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" title="View" onClick={() => navigate(`/events/${e.id}`)}>
                        <Eye size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => navigate(`/admin/events/${e.id}/edit`)}>
                        <Pencil size={15} />
                      </button>
                      {e.status !== 'cancelled' && e.status !== 'completed' && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Cancel event" onClick={() => setCancelTarget(e)}>
                          <Ban size={15} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => setDeleteTarget(e)}>
                        <Trash2 size={15} color="var(--color-danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete event?"
        message={`This will permanently delete "${deleteTarget?.title}" and all of its registrations. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel event?"
        message={`This will mark "${cancelTarget?.title}" as cancelled and notify all registered students.`}
        confirmLabel="Cancel Event"
        danger
        onConfirm={handleCancelEvent}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
