import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(ROOT, 'data', 'orders.sqlite');
const outPath = process.argv[2] || path.join(ROOT, `orders-${new Date().toISOString().slice(0, 10)}.csv`);

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

const db = new Database(dbPath, { readonly: true });
const rows = db.prepare(`
  SELECT
    id, created_at, full_name, email, phone, product, color, quantity,
    address, print_side, team, payment_file
  FROM orders
  ORDER BY id
`).all();
db.close();

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
const csv = `\uFEFF${header.join(',')}\n${rows.map((row) =>
  [
    row.id,
    row.created_at,
    row.full_name,
    row.email,
    row.phone,
    PRODUCT_LABELS[row.product] || row.product,
    COLOR_LABELS[row.color] || row.color,
    row.quantity,
    row.address,
    SIDE_LABELS[row.print_side] || row.print_side || '',
    row.team || '',
    row.payment_file,
  ].map(csvCell).join(','),
).join('\n')}\n`;

fs.writeFileSync(outPath, csv);
console.log(`Записей: ${rows.length}`);
console.log(`Файл: ${outPath}`);
