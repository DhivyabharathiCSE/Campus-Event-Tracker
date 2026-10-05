import { useEffect, useState, useCallback } from 'react';
import { Search, Users } from 'lucide-react';
import api from '../services/api';
import { useToast, getErrorMessage } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dateUtils';

export default function AdminStudents() {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/students', { params });
      setStudents(res.data.data.students);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [search]); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="page-header"><h1>Students</h1></div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input className="input" placeholder="Search by name, email or department..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading students..." />
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students found" message="Try a different search term." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Phone</th><th>Events Registered</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.department || '—'}</td>
                  <td>{s.year || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.event_count}</td>
                  <td>{formatDate(s.created_at?.slice ? s.created_at.slice(0, 10) : s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
