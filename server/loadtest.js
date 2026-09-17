import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.LOADTEST_PORT || 3010);
const TOTAL = Number(process.env.LOADTEST_USERS || 1000);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tribe-loadtest-'));

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: TOTAL + 50,
  maxFreeSockets: 256,
});

function requestJson(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: urlPath,
        method,
        agent,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            data = { error: text.slice(0, 200) };
          }
          resolve({ status: res.statusCode || 0, data });
        });
      },
    );
    req.on('error', reject);
    if (body) req.end(body);
    else req.end();
  });
}

function waitForHealth() {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const result = await requestJson('GET', '/api/health');
        if (result.status === 200) {
          resolve();
          return;
        }
      } catch {
        // server is still starting
      }
      if (Date.now() - started > 15_000) {
        reject(new Error('Сервер нагрузочного теста не поднялся'));
        return;
      }
      setTimeout(tick, 150);
    };
    tick();
  });
}

function submit(index) {
  const started = Date.now();
  const boundary = `----LoadTest${randomBytes(8).toString('hex')}`;
  const fields = {
    fullName: `Тест Пользователь ${index}`,
    email: `loadtest${index}@example.com`,
    phone: '+7 (999) 000-00-00',
    product: 'tshirt',
    color: 'white',
    quantity: '1',
    address: 'Москва, Кутузовский 32 корпус 1',
  };

  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
    ));
  }
  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="payment"; filename="check.png"\r\nContent-Type: image/png\r\n\r\n`,
  ));
  parts.push(PNG);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  return requestJson('POST', '/api/orders', body, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': String(body.length),
  })
    .then(({ status, data }) => ({
      ok: status === 201,
      status,
      ms: Date.now() - started,
      error: data.error,
    }))
    .catch((error) => ({
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error.message,
    }));
}

const child = spawn(process.execPath, [path.join(ROOT, 'server/index.js')], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    DATA_DIR: path.join(TMP, 'data'),
    UPLOAD_DIR: path.join(TMP, 'uploads'),
    ORDER_RATE_LIMIT: String(Math.max(TOTAL * 2, 2000)),
    UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || '64',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let childOut = '';
child.stdout.on('data', (chunk) => {
  childOut += chunk;
});
child.stderr.on('data', (chunk) => {
  childOut += chunk;
});

const shutdown = () => {
  child.kill('SIGTERM');
  fs.rmSync(TMP, { recursive: true, force: true });
};

process.on('exit', shutdown);
process.on('SIGINT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));

try {
  await waitForHealth();
  console.log(`Стартую ${TOTAL} одновременных отправок формы...`);
  const wallStart = Date.now();
  const results = await Promise.all(Array.from({ length: TOTAL }, (_, index) => submit(index + 1)));
  const wallMs = Date.now() - wallStart;
  const ok = results.filter((item) => item.ok);
  const fail = results.filter((item) => !item.ok);
  const times = results.map((item) => item.ms).sort((a, b) => a - b);
  const pct = (p) => times[Math.min(times.length - 1, Math.floor((p / 100) * times.length))];
  const byStatus = {};
  for (const item of results) {
    const key = String(item.status);
    byStatus[key] = (byStatus[key] || 0) + 1;
  }

  console.log(`Готово за ${(wallMs / 1000).toFixed(2)} с`);
  console.log(`Успешно: ${ok.length}/${TOTAL}`);
  console.log(`Ошибки:  ${fail.length}/${TOTAL}`);
  console.log(`Коды:    ${JSON.stringify(byStatus)}`);
  console.log(`p50=${pct(50)}ms p95=${pct(95)}ms p99=${pct(99)}ms max=${times.at(-1)}ms`);
  if (fail.length) {
    const sample = fail.slice(0, 8).map((item) => `${item.status} ${item.error || ''}`.trim());
    console.log(`Примеры ошибок:\n- ${sample.join('\n- ')}`);
    if (childOut.trim()) console.log(`Лог сервера:\n${childOut.trim().slice(-1500)}`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error);
  if (childOut.trim()) console.error(childOut);
  process.exitCode = 1;
} finally {
  agent.destroy();
  shutdown();
}
