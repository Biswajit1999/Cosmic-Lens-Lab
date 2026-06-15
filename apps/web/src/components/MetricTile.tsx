import type { TelemetryField } from '../data/metrics';
import { Sparkline } from './Sparkline';

interface MetricTileProps {
  field: TelemetryField;
  history?: number[];
}

export function MetricTile({ field, history }: MetricTileProps) {
  return (
    <div className="metric-tile">
      <div className="metric-tile__top">
        <span className="metric-symbol">{field.symbol ?? field.label.slice(0, 2)}</span>
        <span className="metric-label">{field.label}</span>
      </div>
      <div className="metric-tile__value">
        <strong>{field.value}</strong>
        {field.unit && <em>{field.unit}</em>}
      </div>
      <div className="metric-tile__foot">
        {field.note ? <span className="metric-note">{field.note}</span> : <span />}
        {history && history.length > 1 && (
          <Sparkline values={history} ariaLabel={`${field.label} trend`} />
        )}
      </div>
    </div>
  );
}
