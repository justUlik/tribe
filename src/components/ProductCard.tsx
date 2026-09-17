import { COLORS } from '../data';
import type { ColorId, Product } from '../types';
import { ButtonCard } from './ButtonCard';

type Props = {
  product: Product;
  selectedColor: ColorId;
  onColorChange: (color: ColorId) => void;
  onOrder: () => void;
  onOpenGallery?: () => void;
  centered?: boolean;
  hidePhoto?: boolean;
};

export function ProductCard({
  product,
  selectedColor,
  onColorChange,
  onOrder,
  onOpenGallery,
  centered,
  hidePhoto,
}: Props) {
  return (
    <article className={`product-card${centered ? ' is-team' : ''}`}>
      {hidePhoto ? null : (
        <button type="button" className="product-photo" onClick={onOpenGallery} aria-label={`Открыть фото: ${product.title}`}>
          <img src={product.image} alt={product.title} width={560} height={434} />
        </button>
      )}
      <div className="product-body">
        <div className="product-copy">
          <div className="product-headline">
            <h3 className="product-title">{product.title}</h3>
            <p className="product-price">{product.price}</p>
          </div>
          <div className="product-meta">
            <p className="product-specs">{product.specs}</p>
            <div className="swatches" role="listbox" aria-label="Цвет">
              {product.colors.map((id) => {
                const color = COLORS.find((item) => item.id === id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`swatch is-${id}${selectedColor === id ? ' is-active' : ''}`}
                    aria-label={color.label}
                    aria-selected={selectedColor === id}
                    onClick={() => onColorChange(id)}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <ButtonCard onClick={onOrder}>Оформить предзаказ</ButtonCard>
      </div>
    </article>
  );
}
