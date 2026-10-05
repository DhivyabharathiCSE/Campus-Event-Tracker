import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import api from '../services/api';

export default function Topbar({ title, onMenuClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      try {
        const res = await api.get('/notifications');
        if (!cancelled) setUnreadCount(res.data.data.unreadCount);
      } catch {
        // silently ignore — notification count is not critical
      }
    }
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <header className="topbar">
      <div className="flex-gap">
        <button className="topbar-menu-btn" onClick={onMenuClick}><Menu size={22} /></button>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-actions">
        <button className="notif-bell" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      </div>
    </header>
  );
}
