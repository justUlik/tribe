import { useEffect, useMemo, useState } from 'react';
import { Footer, Header } from './components/Chrome';
import { CrestGallery } from './components/CrestGallery';
import { Hero } from './components/Hero';
import { InfoSection } from './components/InfoSection';
import { Lightbox } from './components/Lightbox';
import { OrderModal } from './components/OrderModal';
import { ProductCard } from './components/ProductCard';
import { SidePickCard } from './components/SidePickCard';
import { CREST_GALLERY, PRODUCTS, TEAM_SIDES } from './data';
import type { ColorId, LightboxItem, OrderPrefill, PrintSide, ProductId } from './types';

const defaultColors: Record<ProductId, ColorId> = {
  sweatshirt: 'black',
  tshirt: 'black',
  longsleeve: 'black',
  team: 'white',
};

export default function App() {
  const [colors, setColors] = useState<Record<ProductId, ColorId>>(defaultColors);
  const [printSide, setPrintSide] = useState<PrintSide | null>(null);
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null);
  const [order, setOrder] = useState<OrderPrefill | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    document.body.style.overflow = lightbox || order ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightbox, order]);

  const baseProducts = useMemo(() => PRODUCTS.filter((item) => !item.hasCrest), []);
  const teamProduct = PRODUCTS.find((item) => item.hasCrest)!;

  const openOrder = (productId: ProductId) => {
    setOrder({
      productId,
      color: colors[productId],
      printSide: productId === 'team' ? printSide : null,
    });
  };

  return (
    <div className={`page${lightbox ? ' is-blurred' : ''}`}>
      <div className="page-bg" aria-hidden="true">
        <img src="/assets/decor/bg-pattern.svg" alt="" />
      </div>
      <Header />
      <div className="page-content">
        <main className="main">
          <Hero />
          <section className="products">
            <h1 className="section-title">Базовый мерч</h1>
            <div className="product-row">
              {baseProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selectedColor={colors[product.id]}
                  onColorChange={(color) => setColors((prev) => ({ ...prev, [product.id]: color }))}
                  onOrder={() => openOrder(product.id)}
                  onOpenGallery={() => setLightbox({ items: [{ src: product.image, alt: product.title }], index: 0 })}
                />
              ))}
            </div>
          </section>
          <section className="crest-block">
            <div className="crest-intro">
              <h2 className="section-title">Мерч вашего продукта</h2>
              <p className="crest-lead">
                Печать будет только на одной стороне футболки — спереди или сзади,
                <br />
                посмотреть, как выглядит ваш герб и все остальные можно ниже
              </p>
            </div>
            <CrestGallery onOpen={(index) => setLightbox({ items: CREST_GALLERY, index })} />
            <SidePickCard
              side={printSide}
              onSideChange={setPrintSide}
              onOpenGallery={(side) =>
                setLightbox({
                  items: [TEAM_SIDES.front, TEAM_SIDES.back],
                  index: side === 'front' ? 0 : 1,
                })
              }
            />
            <ProductCard
              product={teamProduct}
              selectedColor={colors.team}
              onColorChange={(color) => setColors((prev) => ({ ...prev, team: color }))}
              onOrder={() => openOrder('team')}
              centered
              hidePhoto
            />
          </section>
          <InfoSection />
        </main>
      </div>
      <Footer />
      {lightbox ? (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      ) : null}
      {order ? (
        <OrderModal open mobile={mobile} prefill={order} onClose={() => setOrder(null)} />
      ) : null}
    </div>
  );
}
