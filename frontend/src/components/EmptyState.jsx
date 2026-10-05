import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, message }) {
  return (
    <div className="empty-state">
      <Icon size={40} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
