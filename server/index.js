import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3002);
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
const ORDER_RATE_LIMIT = Number(process.env.ORDER_RATE_LIMIT || 2000);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'orders.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 30000');
db.pragma('temp_store = MEMORY');
db.pragma('cache_size = -64000');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    product TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    address TEXT NOT NULL,
    print_side TEXT,
    team TEXT,
    payment_file TEXT NOT NULL,
    ip TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
`);

try {
  db.exec('ALTER TABLE orders ADD COLUMN team TEXT');
} catch {
  // column already exists
}

const insertOrder = db.prepare(`
  INSERT INTO orders (
    created_at, full_name, email, phone, product, color, quantity,
    address, print_side, team, payment_file, ip
  ) VALUES (
    @created_at, @full_name, @email, @phone, @product, @color, @quantity,
    @address, @print_side, @team, @payment_file, @ip
  )
`);

const selectOrders = db.prepare(`
  SELECT
    id, created_at, full_name, email, phone, product, color, quantity,
    address, print_side, team, payment_file
  FROM orders
  ORDER BY id
`);

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
const EXPORT_TOKEN = process.env.EXPORT_TOKEN || '';

const PRODUCTS = new Set([
  'sweatshirt',
  'tshirt',
  'longsleeve',
  'team',
]);
const COLORS = new Set(['white', 'black', 'red']);
const TEAM_COLORS = new Set(['white', 'black']);
const PRINT_SIDES = new Set(['front', 'back']);
const TEAMS = new Set([
  'ДТБ дизайн',
  'Cash Management',
  'Самоинкассация',
  'Цифровой рубль для бизнеса',
  'Сберказначейство',
  'Бизнес-карта',
  'SmartBridge',
  'Электронная подпись для бизнеса',
  'Банковское сопровождение',
  'Альтернативные платежи',
  'Digital ID',
  'SberConnect+',
  'Инкассация',
  'Машиночитаемая доверенность',
  'Межбанковские расчёты',
  'Аренда индивидуальных сейфов ЮЛ',
  'Избирательные кампании',
  'Кассовые операции',
  'Ликвидность и Обязательства клиентов ЮЛ',
  'Мультибанк',
  'Привлечение средств',
  'Расчёты и платежи',
  'Цифровые права',
  'Model-View-Controller',
  'Поддержка продаж',
  'Расчётное обслуживание',
  'Сервис обмена документами B2B',
  'Платформа цифровых активов',
  'Redesign Metodogy and cost',
  'Продвижение продуктов',
  'Клиентские решения ДТБ',
  'Платформа Про.Бизнес',
  'Product analytics',
  'ОPS',
  'ОPS сервисное сопровождение',
  'ОPS DATASTORE',
  'DTB AI',
  'Разработка для ОPS',
  'OPS Solutions',
  'Practices and processes',
  'Operational Quality Management',
  'Общие прикладные сервисы платформы DB',
  'Платформы Группы компаний и корпоративные связи',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.heic'].includes(ext)
      ? ext
      : '.bin';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const okMime = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/heic',
      'application/pdf',
    ].includes(file.mimetype);
    const okExt = /\.(png|jpe?g|webp|gif|heic|pdf)$/i.test(file.originalname || '');
    if (okMime || okExt) cb(null, true);
    else cb(new Error('Можно загрузить изображение или PDF'));
  },
});

const app = express();
app.set('trust proxy', 1);
app.use(compression());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '32kb' }));

const orderLimiter = rateLimit({
  windowMs: 60_000,
  limit: ORDER_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов, попробуйте через минуту' },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, load: os.loadavg()[0] });
});

app.get('/api/orders.csv', (req, res) => {
  const token = String(req.query.token || req.get('x-export-token') || '');
  if (!EXPORT_TOKEN || token !== EXPORT_TOKEN) {
    res.status(401).json({ error: 'Нет доступа' });
    return;
  }

  const csvCell = (value) => {
    const text = value == null ? '' : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };

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
  const rows = selectOrders.all().map((row) =>
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
  );

  const csv = `\uFEFF${header.join(',')}\n${rows.join('\n')}\n`;
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders-${stamp}.csv"`);
  res.send(csv);
});

app.post('/api/orders', orderLimiter, (req, res, next) => {
  upload.single('payment')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Ошибка загрузки файла' });
      return;
    }
    next();
  });
}, (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'Загрузите скрин об оплате' });
    return;
  }

  const fullName = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const product = String(req.body.product || '').trim();
  const color = String(req.body.color || '').trim();
  const quantity = Number(req.body.quantity);
  const address = String(req.body.address || '').trim();
  const printSide = req.body.printSide ? String(req.body.printSide).trim() : null;
  const team = req.body.team ? String(req.body.team).trim() : null;

  const errors = [];
  if (fullName.replace(/\s+/g, ' ').split(' ').filter(Boolean).length < 2) {
    errors.push('Укажите ФИО полностью');
  }
  if (!EMAIL_RE.test(email)) errors.push('Некорректный email');
  if (!PHONE_RE.test(phone)) errors.push('Некорректный номер телефона');
  if (!PRODUCTS.has(product)) errors.push('Выберите мерч');
  if (product === 'team') {
    if (!TEAM_COLORS.has(color)) errors.push('Выберите цвет');
    if (!TEAMS.has(team || '')) errors.push('Выберите команду');
    if (!PRINT_SIDES.has(printSide || '')) errors.push('Выберите сторону печати');
  } else if (!COLORS.has(color)) {
    errors.push('Выберите цвет');
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    errors.push('Количество от 1 до 99');
  }
  if (!address) errors.push('Выберите адрес доставки');

  if (errors.length) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ error: errors[0], errors });
    return;
  }

  try {
    const payload = {
      created_at: new Date().toISOString(),
      full_name: fullName,
      email,
      phone,
      product,
      color,
      quantity,
      address,
      print_side: product === 'team' ? printSide : null,
      team: product === 'team' ? team : null,
      payment_file: path.basename(file.path),
      ip: req.ip || null,
    };
    let info;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        info = insertOrder.run(payload);
        break;
      } catch (error) {
        if (error?.code !== 'SQLITE_BUSY' || attempt === 7) throw error;
      }
    }
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (error) {
    fs.unlink(file.path, () => {});
    console.error(error);
    res.status(500).json({ error: 'Не удалось сохранить заказ, попробуйте ещё раз' });
  }
});

if (IS_PROD) {
  const dist = path.join(ROOT, 'dist');
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const server = http.createServer(app);
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.requestTimeout = 120_000;
server.timeout = 120_000;
server.maxConnections = 10_000;
server.listen({ port: PORT, host: '0.0.0.0', backlog: 2048 }, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});
