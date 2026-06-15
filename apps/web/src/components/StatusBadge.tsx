interface StatusBadgeProps {
  tone?: 'cyan' | 'amber' | 'violet' | 'green' | 'muted';
  label: string;
  pulse?: boolean;
  title?: string;
}

export function StatusBadge({ tone = 'cyan', label, pulse = false, title }: StatusBadgeProps) {
  return (
    <span className={`status-badge tone-${tone}`} title={title}>
      <span className={`badge-dot${pulse ? ' pulse' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}
