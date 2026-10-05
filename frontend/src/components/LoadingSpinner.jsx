export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      {label && <span style={{ marginLeft: 12, color: 'var(--color-text-muted)' }}>{label}</span>}
    </div>
  );
}
