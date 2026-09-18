import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(ROOT, 'data', 'orders.sqlite');
const uploadsDir = path.join(ROOT, 'uploads');
const stamp = new Date().toISOString().slice(0, 10);
const outDir = path.resolve(process.argv[2] || path.join(ROOT, `export-${stamp}`));
const filesDir = path.join(outDir, 'files');

if (!fs.existsSync(dbPath)) {
  console.error(`Нет базы: ${dbPath}`);
  process.exit(1);
}

const PRODUCT_LABELS = {
  sweatshirt: 'Свитшот оверсайз',
  tshirt: 'Футболка оверсайз',
  longsleeve: 'Лонгслив оверсайз',
  team: 'Футболка с гербом команды',
};
const COLOR_LABELS = {
  white: 'Белый',
  black: 'Чёрный',
  red: 'Красный',
};
const SIDE_LABELS = {
  front: 'Спереди',
  back: 'Сзади',
};

const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const safeFile = (value) =>
  String(value || 'file')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'file';

const db = new Database(dbPath, { readonly: true });
const rows = db.prepare(`
  SELECT
    id, created_at, full_name, email, phone, product, color, quantity,
    address, print_side, team, payment_file
  FROM orders
  ORDER BY id
`).all();
db.close();

fs.mkdirSync(filesDir, { recursive: true });

const header = [
  'id',
  'created_at',
  'full_name',
  'email',
  'phone',
  'product',
  'color',
  'quantity',
  'address',
  'print_side',
  'team',
  'payment_file',
];

const exported = rows.map((row) => {
  const product = PRODUCT_LABELS[row.product] || row.product;
  const color = COLOR_LABELS[row.color] || row.color;
  const side = SIDE_LABELS[row.print_side] || row.print_side || '';
  const src = row.payment_file ? path.join(uploadsDir, row.payment_file) : '';
  const ext = path.extname(row.payment_file || '').toLowerCase() || '.bin';
  const copyName = `${row.id}-${safeFile(row.full_name)}-${safeFile(product)}-${row.quantity}шт${ext}`;
  let relative = '';
  if (src && fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(filesDir, copyName));
    relative = `files/${copyName}`;
  }
  return { ...row, product, color, side, relative, ext };
});

const csv = `\uFEFF${header.join(',')}\n${exported.map((row) =>
  [
    row.id,
    row.created_at,
    row.full_name,
    row.email,
    row.phone,
    row.product,
    row.color,
    row.quantity,
    row.address,
    row.side,
    row.team || '',
    row.relative || row.payment_file || '',
  ].map(csvCell).join(','),
).join('\n')}\n`;

const cards = exported.map((row) => {
  const when = row.created_at ? new Date(row.created_at).toLocaleString('ru-RU') : '';
  let media = '<p class="missing">Файл оплаты не найден</p>';
  if (row.relative) {
    media = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(row.ext)
      ? `<a href="${escapeHtml(row.relative)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(row.relative)}" alt="Чек заказа ${row.id}"></a>`
      : `<a href="${escapeHtml(row.relative)}" target="_blank" rel="noreferrer">Открыть файл оплаты</a>`;
  }
  const team = row.team
    ? `<p><b>Команда:</b> ${escapeHtml(row.team)}</p>`
    : '';
  const side = row.side
    ? `<p><b>Сторона печати:</b> ${escapeHtml(row.side)}</p>`
    : '';
  return `<article class="card">
    <div class="meta">
      <h2>Заказ №${row.id}</h2>
      <p class="when">${escapeHtml(when)}</p>
      <p><b>ФИО:</b> ${escapeHtml(row.full_name)}</p>
      <p><b>Почта:</b> ${escapeHtml(row.email)}</p>
      <p><b>Телефон:</b> ${escapeHtml(row.phone)}</p>
      <p><b>Мерч:</b> ${escapeHtml(row.product)}</p>
      <p><b>Цвет:</b> ${escapeHtml(row.color)}</p>
      <p><b>Количество:</b> ${escapeHtml(row.quantity)} шт.</p>
      ${team}${side}
      <p><b>Адрес:</b> ${escapeHtml(row.address)}</p>
    </div>
    <div class="photo">${media}</div>
  </article>`;
}).join('\n');

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Заказы мерча — ${stamp}</title>
  <style>
    body { margin: 0; background: #f7f7f7; color: #111; font: 16px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px 64px; }
    .lead { color: #555; margin: 0 0 24px; }
    .card { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr); gap: 24px; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    h2 { margin: 0 0 4px; font-size: 20px; }
    .when, .missing { color: #666; }
    p { margin: 6px 0; }
    img { display: block; width: 100%; max-height: 420px; object-fit: contain; background: #f0f0f0; border-radius: 4px; }
    @media (max-width: 800px) { .card { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Заказы мерча</h1>
    <p class="lead">${exported.length} записей · ${stamp}</p>
    ${cards || '<p>Заказов пока нет.</p>'}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'orders.csv'), csv);
fs.writeFileSync(path.join(outDir, 'orders.html'), html);
console.log(`Записей: ${exported.length}`);
console.log(`Папка: ${outDir}`);
console.log(`Откройте: ${path.join(outDir, 'orders.html')}`);
