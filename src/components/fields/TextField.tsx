type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'email';
  autoComplete?: string;
};

export function TextField({ value, placeholder, onChange, error, type = 'text', autoComplete }: Props) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field-box">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
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
