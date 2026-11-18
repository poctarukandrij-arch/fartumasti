export function Toasts({ items }) {
  if (!items.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={['toast', toast.kind === 'error' ? 'toast--error' : toast.kind === 'success' ? 'toast--success' : '']
            .filter(Boolean)
            .join(' ')}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
