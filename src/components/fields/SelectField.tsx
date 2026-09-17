import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Option<T extends string> = {
  id: T;
  label: string;
  swatch?: string;
};

type Props<T extends string> = {
  value: T | '';
  options: Option<T>[];
  placeholder: string;
  emptyLabel: string;
  onChange: (value: T) => void;
  error?: boolean;
};

export function SelectField<T extends string>({
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
  error,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [menuMax, setMenuMax] = useState(240);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((item) => item.id === value);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const field = rootRef.current.getBoundingClientRect();
    const wrap = rootRef.current.closest('.modal, .sheet-panel');
    const bottom = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight;
    setMenuMax(Math.max(88, Math.floor(bottom - field.bottom - 12)));
  }, [open]);

  return (
    <div className={`field${open ? ' is-open' : ''}${error ? ' has-error' : ''}`} ref={rootRef}>
      <button type="button" className="field-box" onClick={() => setOpen((v) => !v)}>
        <span className={`field-value${selected ? ' is-filled' : ''}`}>
          {open && !selected ? emptyLabel : selected?.label || placeholder}
        </span>
        <img
          className="field-icon"
          src={open ? '/assets/ui/chevron.svg' : '/assets/ui/chevron-default.svg'}
          alt=""
          width={16}
          height={16}
        />
      </button>
      {open ? (
        <div className="dropdown" role="listbox" style={{ maxHeight: menuMax }}>
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dropdown-item${item.id === value ? ' is-active' : ''}`}
              onClick={() => {
                onChange(item.id);
                setOpen(false);
              }}
            >
              {item.swatch ? <span className="color-dot" style={{ background: item.swatch }} /> : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
