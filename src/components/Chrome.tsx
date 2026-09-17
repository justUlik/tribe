function Line() {
  return (
    <picture>
      <source media="(max-width: 400px)" srcSet="/assets/ui/line_360.png" />
      <source media="(max-width: 900px)" srcSet="/assets/ui/line_575.png" />
      <source media="(max-width: 1600px)" srcSet="/assets/ui/line_1440.png" />
      <img className="bar-line" src="/assets/ui/line_1920.png" alt="" width={1920} height={76} />
    </picture>
  );
}

export function Header() {
  return (
    <header className="bar">
      <Line />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bar">
      <Line />
    </footer>
  );
}
