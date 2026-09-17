import { useEffect, useRef } from 'react';

type Props = {
  items: { src: string; alt: string }[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function Lightbox({ items, index, onClose, onIndexChange }: Props) {
  const item = items[index];
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + items.length) % items.length);
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;

  const prev = () => onIndexChange((index - 1 + items.length) % items.length);
  const next = () => onIndexChange((index + 1) % items.length);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" ref={rootRef} onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Закрыть" onClick={onClose}>
        <img src="/assets/ui/close.svg" alt="" width={20} height={20} />
      </button>
      {items.length > 1 ? (
        <button
          type="button"
          className="lightbox-nav is-prev"
          aria-label="Назад"
          onClick={(event) => {
            event.stopPropagation();
            prev();
          }}
        >
          <img src="/assets/ui/arrow-left.svg" alt="" width={24} height={24} />
        </button>
      ) : null}
      <div className="lightbox-image-wrap" onClick={(event) => event.stopPropagation()}>
        <img src={item.src} alt={item.alt} />
      </div>
      {items.length > 1 ? (
        <button
          type="button"
          className="lightbox-nav is-next"
          aria-label="Вперёд"
          onClick={(event) => {
            event.stopPropagation();
            next();
          }}
        >
          <img src="/assets/ui/arrow-right.svg" alt="" width={24} height={24} />
        </button>
      ) : null}
    </div>
  );
}
