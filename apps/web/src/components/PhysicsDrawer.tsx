import { FERMAT_POTENTIAL, GLOSSARY, LENS_EQUATION, MAGNIFICATION, MODELS, TIME_DELAY } from '../data/glossary';
import { Overlay } from './Overlay';

interface PhysicsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function PhysicsDrawer({ open, onClose }: PhysicsDrawerProps) {
  return (
    <Overlay open={open} title="Physics reference" eyebrow="Thin-lens formalism" side="right" onClose={onClose}>
      <div className="equation-stack">
        <div className="equation-block">
          <span>Lens equation</span>
          <strong>{LENS_EQUATION}</strong>
        </div>
        <div className="equation-block">
          <span>Magnification</span>
          <strong>{MAGNIFICATION}</strong>
        </div>
        <div className="equation-block">
          <span>Fermat potential</span>
          <strong>{FERMAT_POTENTIAL}</strong>
        </div>
        <div className="equation-block">
          <span>Time delay</span>
          <strong>{TIME_DELAY}</strong>
        </div>
      </div>

      <h3 className="drawer-subhead">Quantities</h3>
      <dl className="glossary">
        {GLOSSARY.map((entry) => (
          <div key={entry.symbol} className="glossary__row">
            <dt>
              <span className="glossary__symbol">{entry.symbol}</span>
              {entry.term}
            </dt>
            <dd>{entry.detail}</dd>
          </div>
        ))}
      </dl>

      <h3 className="drawer-subhead">Lens models</h3>
      <ul className="model-list">
        {MODELS.map((model) => (
          <li key={model.tag} className="model-list__item">
            <span className="model-tag mono">{model.tag}</span>
            <div>
              <strong>{model.name}</strong>
              <p>{model.detail}</p>
            </div>
            <span className={`status-badge tone-${model.status === 'live' ? 'green' : 'amber'}`}>
              {model.status === 'live' ? 'Live' : 'Prototype'}
            </span>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}
