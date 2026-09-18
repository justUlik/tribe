import { CREST_GALLERY } from '../data';

type Props = {
  onOpen: (index: number) => void;
};

export function CrestGallery({ onOpen }: Props) {
  return (
    <div className="crest-gallery">
      {CREST_GALLERY.map((item, index) => (
        <button key={item.src} type="button" className="crest-thumb" onClick={() => onOpen(index)}>
          <img src={item.src} alt={item.alt} width={1920} height={1510} />
        </button>
      ))}
    </div>
  );
}
