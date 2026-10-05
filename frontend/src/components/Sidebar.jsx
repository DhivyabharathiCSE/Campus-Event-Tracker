import { NavLink } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, CalendarDays, CalendarCheck, Bell,
  User, LogOut, ClipboardList, Users, PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/my-events', label: 'My Events', icon: ClipboardList },
  { to: '/calendar', label: 'Calendar', icon: CalendarCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/events', label: 'Manage Events', icon: CalendarDays },
  { to: '/admin/events/create', label: 'Create Event', icon: PlusCircle },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const initials = (user?.name || '?')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><GraduationCap size={20} /></div>
        <div className="sidebar-brand-text">
          Campus Events
          <span>{user?.role === 'admin' ? 'Admin Portal' : 'Student Portal'}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to.endsWith('dashboard') || link.to === '/events' || link.to === '/admin/events'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <link.icon size={17} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </aside>
  );
}
