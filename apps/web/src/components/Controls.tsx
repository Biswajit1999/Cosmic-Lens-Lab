interface ControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Control({ label, min, max, step, value, unit, onChange }: ControlProps) {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return (
    <label className="control-row">
      <span className="control-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <strong className="control-value">
        {value.toFixed(decimals)}
        {unit && <em>{unit}</em>}
      </strong>
    </label>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  format?: (value: T) => string;
  onChange: (value: T) => void;
}

export function Select<T extends string>({ label, value, options, format, onChange }: SelectProps<T>) {
  return (
    <label className="select-row">
      <span className="control-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label}>
        {options.map((option) => (
          <option key={option} value={option}>
            {format ? format(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
