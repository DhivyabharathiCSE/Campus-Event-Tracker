import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { CATEGORIES } from '../utils/dateUtils';

const emptyForm = {
  title: '', description: '', category: '', event_date: '', start_time: '',
  end_time: '', venue: '', capacity: '', deadline_date: '', deadline_time: '', image_url: '',
};

export default function AdminEventForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      try {
        const res = await api.get(`/events/${id}`);
        const e = res.data.data.event;
        const [deadlineDate, deadlineTime] = e.registration_deadline.split(' ');
        setForm({
          title: e.title,
          description: e.description || '',
          category: e.category,
          event_date: e.event_date,
          start_time: e.start_time.slice(0, 5),
          end_time: e.end_time.slice(0, 5),
          venue: e.venue,
          capacity: e.capacity,
          deadline_date: deadlineDate,
          deadline_time: (deadlineTime || '00:00:00').slice(0, 5),
          image_url: e.image_url || '',
        });
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        navigate('/admin/events');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]); // eslint-disable-line

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.category) errs.category = 'Category is required.';
    if (!form.event_date) errs.event_date = 'Event date is required.';
    if (!form.start_time) errs.start_time = 'Start time is required.';
    if (!form.end_time) errs.end_time = 'End time is required.';
    if (form.start_time && form.end_time && form.start_time >= form.end_time) {
      errs.end_time = 'End time must be after start time.';
    }
    if (!form.venue.trim()) errs.venue = 'Venue is required.';
    if (!form.capacity || Number(form.capacity) <= 0) errs.capacity = 'Capacity must be greater than 0.';
    if (!form.deadline_date || !form.deadline_time) errs.deadline_date = 'Registration deadline is required.';
    else {
      const deadline = new Date(`${form.deadline_date}T${form.deadline_time}`);
      const eventStart = new Date(`${form.event_date}T${form.start_time}`);
      if (form.event_date && form.start_time && deadline > eventStart) {
        errs.deadline_date = 'Deadline must be before the event start time.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        event_date: form.event_date,
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
        venue: form.venue.trim(),
        capacity: Number(form.capacity),
        registration_deadline: `${form.deadline_date} ${form.deadline_time}:00`,
        image_url: form.image_url.trim() || null,
      };
      if (isEdit) {
        await api.put(`/events/${id}`, payload);
        showToast('Event updated successfully.', 'success');
      } else {
        await api.post('/events', payload);
        showToast('Event created successfully.', 'success');
      }
      navigate('/admin/events');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading event..." />;

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/admin/events')}>
        <ArrowLeft size={16} /> Back to Events
      </button>
      <div className="page-header"><h1>{isEdit ? 'Edit Event' : 'Create Event'}</h1></div>

      <form onSubmit={handleSubmit} noValidate className="card card-pad" style={{ maxWidth: 720 }}>
        <div className="field">
          <label htmlFor="title">Event Title</label>
          <input id="title" className="input" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. AI Workshop" />
          {errors.title && <div className="field-error">{errors.title}</div>}
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" className="input" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What is this event about?" />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" className="input" value={form.category} onChange={(e) => update('category', e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <div className="field-error">{errors.category}</div>}
          </div>
          <div className="field">
            <label htmlFor="venue">Venue</label>
            <input id="venue" className="input" value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="e.g. Seminar Hall A" />
            {errors.venue && <div className="field-error">{errors.venue}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="event_date">Event Date</label>
            <input id="event_date" type="date" className="input" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} />
            {errors.event_date && <div className="field-error">{errors.event_date}</div>}
          </div>
          <div className="field">
            <label htmlFor="start_time">Start Time</label>
            <input id="start_time" type="time" className="input" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} />
            {errors.start_time && <div className="field-error">{errors.start_time}</div>}
          </div>
          <div className="field">
            <label htmlFor="end_time">End Time</label>
            <input id="end_time" type="time" className="input" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} />
            {errors.end_time && <div className="field-error">{errors.end_time}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="capacity">Capacity</label>
            <input id="capacity" type="number" min="1" className="input" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} placeholder="e.g. 100" />
            {errors.capacity && <div className="field-error">{errors.capacity}</div>}
          </div>
          <div className="field">
            <label htmlFor="deadline_date">Registration Deadline Date</label>
            <input id="deadline_date" type="date" className="input" value={form.deadline_date} onChange={(e) => update('deadline_date', e.target.value)} />
            {errors.deadline_date && <div className="field-error">{errors.deadline_date}</div>}
          </div>
          <div className="field">
            <label htmlFor="deadline_time">Registration Deadline Time</label>
            <input id="deadline_time" type="time" className="input" value={form.deadline_time} onChange={(e) => update('deadline_time', e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="image_url">Image URL (optional)</label>
          <input id="image_url" className="input" value={form.image_url} onChange={(e) => update('image_url', e.target.value)} placeholder="https://..." />
        </div>

        <div className="flex-gap">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/events')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
