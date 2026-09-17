import { TEAM_SIDES } from '../data';
import type { PrintSide } from '../types';

type Props = {
  side: PrintSide | null;
  onSideChange: (side: PrintSide) => void;
  onOpenGallery: (side: PrintSide) => void;
};

export function SidePickCard({ side, onSideChange, onOpenGallery }: Props) {
  const pick = (next: PrintSide) => {
    if (side === next) onOpenGallery(next);
    else onSideChange(next);
  };

  return (
    <div className="side-pick">
      <div className="side-cards">
        <button
          type="button"
          className={`side-card${side === 'front' ? ' is-active' : ''}`}
          onClick={() => pick('front')}
          aria-pressed={side === 'front'}
          aria-label="Печать спереди"
        >
          <img src={TEAM_SIDES.front.src} alt={TEAM_SIDES.front.alt} width={666} height={725} />
        </button>
        <button
          type="button"
          className={`side-card${side === 'back' ? ' is-active' : ''}`}
          onClick={() => pick('back')}
          aria-pressed={side === 'back'}
          aria-label="Печать сзади"
        >
          <img src={TEAM_SIDES.back.src} alt={TEAM_SIDES.back.alt} width={666} height={725} />
        </button>
      </div>
      <div className="side-picker">
        <button
          type="button"
          className={`side-option is-front${side === 'front' ? ' is-active' : ''}`}
          onClick={() => onSideChange('front')}
        >
          <span>Спереди</span>
          <span className="side-check">
            {side === 'front' ? <img src="/assets/ui/check-x.svg" alt="" width={32} height={32} /> : null}
          </span>
        </button>
        <button
          type="button"
          className={`side-option${side === 'back' ? ' is-active' : ''}`}
          onClick={() => onSideChange('back')}
        >
          <span className="side-check">
            {side === 'back' ? <img src="/assets/ui/check-x.svg" alt="" width={32} height={32} /> : null}
          </span>
          <span>Сзади</span>
        </button>
      </div>
    </div>
  );
}
