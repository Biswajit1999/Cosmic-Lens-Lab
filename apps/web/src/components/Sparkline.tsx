interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  ariaLabel?: string;
}

/** Lightweight inline SVG sparkline — no chart dependency. */
export function Sparkline({ values, width = 96, height = 26, color = 'var(--cyan)', ariaLabel }: SparklineProps) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" className="sparkline" />;
  }
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const step = width / (clean.length - 1);
  const points = clean
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`)
    .join(' ');
  const lastX = (clean.length - 1) * step;
  const lastY = height - ((clean[clean.length - 1] - min) / span) * (height - 4) - 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
      role="img"
      aria-label={ariaLabel}
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={1.8} fill={color} />
    </svg>
  );
}
