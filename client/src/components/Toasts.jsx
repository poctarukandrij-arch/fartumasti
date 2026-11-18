export function Toasts({ items }) {
  if (!items?.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast toast--${item.kind || 'info'}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}

export default Toasts;
