import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatTime } from '../utils/dateUtils';

export default function EventCard({ event, isRegistered, onRegister, onCancel, registering }) {
  const seatsLeft = event.capacity - event.registration_count;
  const isFull = seatsLeft <= 0;
  const canAct = event.status === 'upcoming' || event.status === 'ongoing';

  let actionButton;
  if (event.status === 'cancelled') {
    actionButton = <button className="btn btn-outline" disabled>Cancelled</button>;
  } else if (event.status === 'completed') {
    actionButton = <button className="btn btn-outline" disabled>Completed</button>;
  } else if (isRegistered) {
    actionButton = (
      <button className="btn btn-danger" onClick={() => onCancel(event)} disabled={registering}>
        Registered — Cancel
      </button>
    );
  } else if (isFull) {
    actionButton = <button className="btn btn-outline" disabled>Registration Full</button>;
  } else if (canAct) {
    actionButton = (
      <button className="btn btn-accent" onClick={() => onRegister(event)} disabled={registering}>
        Register
      </button>
    );
  } else {
    actionButton = <button className="btn btn-outline" disabled>Unavailable</button>;
  }

  return (
    <div className="event-card">
      <div className="event-card-top">
        <span className="event-card-category">{event.category}</span>
        <div className="event-card-title">{event.title}</div>
        <div className="event-card-meta">
          <div><Calendar size={14} /> {formatDate(event.event_date)}</div>
          <div><Clock size={14} /> {formatTime(event.start_time)} – {formatTime(event.end_time)}</div>
          <div><MapPin size={14} /> {event.venue}</div>
          <div><User size={14} /> {event.organizer_name}</div>
        </div>
      </div>
      <div className="event-card-body">
        <div className="capacity-text">
          <span><Users size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{event.registration_count} registered</span>
          <span>{Math.max(seatsLeft, 0)} seats left</span>
        </div>
        <div className="capacity-bar-track">
          <div
            className="capacity-bar-fill"
            style={{ width: `${Math.min((event.registration_count / event.capacity) * 100, 100)}%` }}
          />
        </div>
        <div><StatusBadge status={event.status} /></div>
      </div>
      <div className="event-card-footer">
        <Link to={`/events/${event.id}`} className="btn btn-outline">View Details</Link>
        {actionButton}
      </div>
    </div>
  );
}
