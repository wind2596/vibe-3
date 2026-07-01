type StatusPillProps = {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
};

export function StatusPill({ label, value, tone = 'neutral' }: StatusPillProps) {
  return (
    <div className={`status-pill tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
