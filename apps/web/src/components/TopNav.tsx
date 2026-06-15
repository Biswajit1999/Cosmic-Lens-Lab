import { StatusBadge } from './StatusBadge';

const GITHUB_URL = 'https://github.com/Biswajit1999/Cosmic-Lens-Lab';
const BLOG_URL = 'https://biswajit1999.github.io/Biswajit_Jana.github.io/blog/index.html';

interface TopNavProps {
  sceneName: string;
  playing: boolean;
  reducedMotion: boolean;
  onOpenPresets: () => void;
  onOpenPhysics: () => void;
  onOpenValidation: () => void;
}

export function TopNav({
  sceneName,
  playing,
  reducedMotion,
  onOpenPresets,
  onOpenPhysics,
  onOpenValidation,
}: TopNavProps) {
  return (
    <header className="top-nav" role="banner">
      <a className="brand" href="#console" aria-label="CosmicLens Lab home">
        <span className="brand-orb" aria-hidden="true" />
        <span className="brand-text">
          <strong>CosmicLens Lab</strong>
          <em>strong-lensing command deck</em>
        </span>
      </a>

      <nav className="nav-actions" aria-label="Primary">
        <button type="button" className="nav-link" onClick={onOpenPresets}>
          Presets
        </button>
        <button type="button" className="nav-link" onClick={onOpenPhysics}>
          Physics
        </button>
        <button type="button" className="nav-link" onClick={onOpenValidation}>
          Validation
        </button>
        <a className="nav-link" href={BLOG_URL} target="_blank" rel="noreferrer">
          Blog
        </a>
        <a className="nav-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>

      <div className="nav-status" aria-live="polite">
        <StatusBadge tone="cyan" label="Thin-lens mode" title="Single-plane thin-lens approximation" />
        <StatusBadge tone="violet" label="Browser sim" title="Runs entirely in your browser" />
        <StatusBadge tone="green" label="Python validated" title="Parity tests against the Python reference core" />
        <StatusBadge
          tone={playing && !reducedMotion ? 'amber' : 'muted'}
          label={reducedMotion ? 'Static' : playing ? 'Live render' : 'Paused'}
          pulse={playing && !reducedMotion}
          title="Animation loop state"
        />
      </div>
    </header>
  );
}

export { GITHUB_URL, BLOG_URL };
