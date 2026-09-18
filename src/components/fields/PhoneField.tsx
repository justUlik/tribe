function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').replace(/^8/, '7').replace(/^7/, '');
  const d = digits.slice(0, 10);
  if (!d.length) return '';
  if (d.length <= 3) return `+7 (${d}`;
  if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function PhoneField({ value, onChange, error }: Props) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field-box">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          placeholder="Номер телефона"
          onChange={(event) => onChange(formatPhone(event.target.value))}
        />
        {value ? (
          <button type="button" aria-label="Очистить" onClick={() => onChange('')}>
            <img className="field-icon" src="/assets/ui/clear.svg" alt="" width={16} height={16} />
          </button>
        ) : null}
      </span>
      {error ? <span className="field-hint">{error}</span> : null}
    </label>
  );
}
