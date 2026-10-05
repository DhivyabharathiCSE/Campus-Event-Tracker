import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/events');
        if (mounted) setEvents(res.data.data.events);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []); // eslint-disable-line

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.event_date]) map[e.event_date] = [];
      map[e.event_date].push(e);
    });
    return map;
  }, [events]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayKey = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, outside: true, key: `prev-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outside: false, key: toDateKey(year, month, d) });
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - (firstDay + daysInMonth) + 1;
    cells.push({ day: d, outside: true, key: `next-${d}` });
  }

  function changeMonth(delta) {
    setCurrent(new Date(year, month + delta, 1));
  }

  if (loading) return <LoadingSpinner label="Loading calendar..." />;

  return (
    <div>
      <div className="page-header"><h1>Calendar</h1></div>

      <div className="card card-pad">
        <div className="calendar-nav">
          <button className="btn btn-outline btn-icon" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
          <h2 style={{ margin: 0 }}>{MONTHS[month]} {year}</h2>
          <button className="btn btn-outline btn-icon" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map((wd) => <div key={wd} className="calendar-weekday">{wd}</div>)}
          {cells.map((cell) => {
            const dateKey = cell.outside ? null : cell.key;
            const dayEvents = dateKey ? (eventsByDate[dateKey] || []) : [];
            return (
              <div
                key={cell.key}
                className={`calendar-cell ${cell.outside ? 'outside' : ''} ${dateKey === todayKey ? 'today' : ''}`}
              >
                <div className="calendar-date">{cell.day}</div>
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="calendar-event-chip"
                    title={e.title}
                    onClick={() => navigate(`/events/${e.id}`)}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="calendar-event-chip" style={{ background: 'transparent', color: 'var(--color-text-muted)' }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
