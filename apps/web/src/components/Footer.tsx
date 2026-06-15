const AUTHOR_URL = 'https://biswajit1999.github.io/Biswajit_Jana.github.io/';
const BLOG_URL = 'https://biswajit1999.github.io/Biswajit_Jana.github.io/blog/index.html';
const GITHUB_URL = 'https://github.com/Biswajit1999/Cosmic-Lens-Lab';

export function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__left">
        <span className="mono dim">CosmicLens Lab · browser-native strong-lensing console</span>
        <span className="mono faint">Thin-lens approximation · MIT licensed · not a production modelling pipeline</span>
      </div>
      <div className="app-footer__right">
        <span className="author">
          Built by{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
            Biswajit Jana
          </a>
        </span>
        <span className="footer-sep" aria-hidden="true">·</span>
        <a href={BLOG_URL} target="_blank" rel="noreferrer">
          Blog
        </a>
        <span className="footer-sep" aria-hidden="true">·</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
