import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface OverlayProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  side?: 'right' | 'center';
  onClose: () => void;
  children: ReactNode;
}

/** Accessible modal / drawer shell with Escape-to-close and restrained UI motion. */
export function Overlay({ open, title, eyebrow, side = 'center', onClose, children }: OverlayProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : side === 'right'
      ? { opacity: 0, x: 24, scale: 0.985 }
      : { opacity: 0, y: 14, scale: 0.985 };
  const panelExit = reduceMotion
    ? { opacity: 0 }
    : side === 'right'
      ? { opacity: 0, x: 16, scale: 0.99 }
      : { opacity: 0, y: 8, scale: 0.99 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.16, ease: 'easeOut' }}
        >
          <motion.button
            type="button"
            className="overlay__backdrop"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          />
          <motion.div
            className={`overlay__panel overlay__panel--${side}`}
            initial={panelInitial}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={panelExit}
            transition={{ type: reduceMotion ? 'tween' : 'spring', duration: reduceMotion ? 0.01 : undefined, stiffness: 340, damping: 30, mass: 0.72 }}
          >
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
