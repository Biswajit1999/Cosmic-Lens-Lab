import { useEffect, type ReactNode } from 'react';

interface OverlayProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  side?: 'right' | 'center';
  onClose: () => void;
  children: ReactNode;
}

/** Accessible modal / drawer shell with backdrop and Escape-to-close. */
export function Overlay({ open, title, eyebrow, side = 'center', onClose, children }: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="overlay__backdrop" aria-label="Close" onClick={onClose} />
      <div className={`overlay__panel overlay__panel--${side}`}>
        <header className="overlay__head">
          <div>
            {eyebrow && <p className="panel__eyebrow">{eyebrow}</p>}
            <h2 className="panel__title">{title}</h2>
          </div>
          <button type="button" className="overlay__close" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        </header>
        <div className="overlay__body">{children}</div>
      </div>
    </div>
  );
}
