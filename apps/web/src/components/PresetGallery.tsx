import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { buildPresetCards, STATUS_LABEL } from '../data/presets';
import { Overlay } from './Overlay';

interface PresetGalleryProps {
  open: boolean;
  activeName: string;
  onClose: () => void;
  onSelect: (presetId: string) => void;
}

export function PresetGallery({ open, activeName, onClose, onSelect }: PresetGalleryProps) {
  const cards = useMemo(() => buildPresetCards(), []);
  const reduceMotion = useReducedMotion();

  return (
    <Overlay open={open} title="Preset lensing theatres" eyebrow="Curated experiments" onClose={onClose}>
      <p className="overlay__lead">
        Each preset is a reproducible JSON scene, not a static illustration. Loading one re-seeds the live console with
        its lens model, source geometry and animation mode.
      </p>
      <div className="preset-grid">
        {cards.map(({ preset, family, config, status, caveat }, index) => {
          const active = preset.scene.name === activeName;
          return (
            <motion.button
              key={preset.id}
              type="button"
              className={`preset-card${active ? ' active' : ''}`}
              onClick={() => {
                onSelect(preset.id);
                onClose();
              }}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.012 }}
              whileTap={reduceMotion ? undefined : { scale: 0.988 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              <div className="preset-card__top">
                <span className="preset-index">{String(index + 1).padStart(2, '0')}</span>
                <span className={`status-badge tone-${status === 'live' ? 'green' : status === 'prototype' ? 'amber' : 'violet'}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <strong className="preset-card__title">{preset.title}</strong>
              <span className="preset-card__family mono">{family}</span>
              <p className="preset-card__desc">{preset.description}</p>
              <div className="preset-card__foot mono">{config}</div>
              {caveat && <div className="preset-card__caveat">{caveat}</div>}
            </motion.button>
          );
        })}
      </div>
    </Overlay>
  );
}
