import { useEffect, useState } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

function clampQty(raw: string) {
  const next = Number(raw.replace(/\D/g, '') || '1');
  return Math.max(1, Math.min(99, next));
}

export function QtyStepper({ value, onChange }: Props) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [focused, value]);

  return (
    <label className="field qty-field">
      <span className="field-box">
        <input
          type="text"
          inputMode="numeric"
          aria-label="Количество"
          value={text}
          style={{ width: `${Math.max(1, text.length)}ch` }}
          onFocus={(event) => {
            setFocused(true);
            const input = event.currentTarget;
            requestAnimationFrame(() => input.select());
          }}
          onBlur={() => {
            const next = clampQty(text);
            setFocused(false);
            setText(String(next));
            onChange(next);
          }}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 2);
            setText(digits);
            if (digits && Number(digits) >= 1) onChange(clampQty(digits));
          }}
        />
        <span className="qty-suffix">шт.</span>
      </span>
    </label>
  );
}
