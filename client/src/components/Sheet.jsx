import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Нижний шит через портал: рендерится поверх приложения в body,
 * поэтому открытие не сдвигает страницу и не вызывает прокрутку.
 */
export function Sheet({ open, onClose, label, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="cs-sheet" role="dialog" aria-modal="true" aria-label={label || title} onClick={onClose}>
      <div className="cs-sheet__panel" onClick={(event) => event.stopPropagation()}>
        <span className="cs-sheet__grab" aria-hidden="true" />
        <div className="cs-sheet__head">
          <div>
            <span className="cs-sheet__title">{title}</span>
            {subtitle ? <span className="cs-sheet__sub">{subtitle}</span> : null}
          </div>
          <button type="button" className="v2-link" onClick={onClose}>
            Закрыть
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Sheet;
