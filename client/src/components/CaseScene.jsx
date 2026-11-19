// Полноэкранная сцена открытия кейса.
// Портал в document.body + position:fixed на весь вьюпорт: сцена всегда
// по центру видимой области, независимо от того, где на странице нажали кейс.
// Прокрутка страницы блокируется и восстанавливается после закрытия.
import { useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export function CaseScene({ open, children, label = 'Открытие кейса' }) {
  // Блокировка фона: фиксируем body на текущей прокрутке, затем возвращаем.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Esc закрывает сцену, как обычное модальное окно.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        const close = document.querySelector('[data-case-close]');
        if (close instanceof HTMLElement) close.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fm-scene" role="dialog" aria-modal="true" aria-label={label}>
      <div className="fm-scene__backdrop" aria-hidden="true" />
      <div className="fm-scene__inner">{children}</div>
    </div>,
    document.body,
  );
}

export default CaseScene;
