export function Hero() {
  return (
    <section className="hero" aria-label="Гербы DR Tribe">
      <div className="shield shield-left">
        <img className="shield-shape" src="/assets/hero/shield-left.png" alt="" width={562} height={634} />
      </div>
      <div className="shield shield-center">
        <img className="shield-shape" src="/assets/hero/shield-center.png" alt="B2B DR" width={562} height={634} />
      </div>
      <div className="shield shield-right">
        <img className="shield-shape" src="/assets/hero/shield-right.png" alt="" width={562} height={634} />
      </div>
    </section>
  );
}
