import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <div className="page-header"><h1>Profile</h1></div>

      <div className="card card-pad" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ marginBottom: 2 }}>{user.name}</h2>
            <span className="badge badge-upcoming" style={{ textTransform: 'capitalize' }}>{user.role}</span>
          </div>
        </div>

        <div className="field">
          <label>Email</label>
          <input className="input" value={user.email} disabled />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Department</label>
            <input className="input" value={user.department || '—'} disabled />
          </div>
          <div className="field">
            <label>Year</label>
            <input className="input" value={user.year || '—'} disabled />
          </div>
        </div>
        <div className="field">
          <label>Phone</label>
          <input className="input" value={user.phone || '—'} disabled />
        </div>
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Profile details are set at registration. Contact an administrator to update them.
        </p>
      </div>
    </div>
  );
}
