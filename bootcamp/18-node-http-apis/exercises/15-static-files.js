// ─────────────────────────────────────────────────────────────────────────
//  15 · static files                                         ★★★ stretch
//  concepts: fs · path containment · mime types · path traversal
//  run: node 15-static-files.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Serve a directory over HTTP — and do not serve anything else.
//
//      safeJoin(root, '/index.html')     → <root>/index.html
//      safeJoin(root, '/notes/deep.txt') → <root>/notes/deep.txt
//      safeJoin(root, '/')               → <root>
//      safeJoin(root, '/../secret.txt')  → null
//      safeJoin(root, '/%2e%2e/secret.txt')  → null
//      safeJoin(root, '/..%2fsecret.txt')    → null
//
//      staticFiles(root) → middleware that
//        · answers 403 { error: 'forbidden' } when safeJoin says null
//        · serves a directory's index.html
//        · sets content-type from MIME (OCTET_STREAM for an extension
//          it does not know) and a correct content-length
//        · calls next() when there is no such file (the routes may
//          still want it)
//
//  Use rawPathOf(req) — the path exactly as it arrived. Decoding and
//  resolving are your job, and searching the string for '..' is not a
//  defence: '%2e%2e%2f' is the same attack in different bytes.
//
//  hint: resolve to an absolute path first, then ask path.relative(root,
//  target) whether it starts with '..' or is absolute

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Provided: the loopback harness, plus `raw()` — a client that sends the
// path EXACTLY as written. fetch() normalises '/../x' to '/x' before it
// hits the wire, so it cannot express the attack this exercise defends
// against. An attacker's client will not be so polite.
async function withServer(handler, run) {
  const thrown = [];
  const server = http.createServer((req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err) => {
        thrown.push(err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end();
        }
      });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const check = () => {
    if (thrown.length) throw thrown.shift();
  };
  const request = async (target = '/', init) => {
    const res = await fetch(`http://127.0.0.1:${port}${target}`, init);
    const body = await res.text();
    check();
    return {
      status: res.status,
      headers: res.headers,
      body,
      json: () => JSON.parse(body),
    };
  };
  const raw = (rawPath) =>
    new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: rawPath }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            check();
          } catch (err) {
            reject(err);
            return;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
  try {
    return await run(request, raw);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

// Provided: sendJson (01), the middleware runner (05), a mime table, and
// the request path exactly as it arrived.
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

function createApp() {
  const stack = [];
  const app = {
    use(fn) {
      stack.push(fn);
      return app;
    },
    handler(req, res) {
      const dispatch = (index) => {
        if (index >= stack.length) return sendJson(res, 404, { error: 'not found' });
        let called = false;
        const next = () => {
          if (called) return;
          called = true;
          if (res.writableEnded) return;
          dispatch(index + 1);
        };
        Promise.resolve()
          .then(() => stack[index](req, res, next))
          .catch((err) => {
            if (!res.writableEnded) sendJson(res, 500, { error: err.message });
          });
      };
      dispatch(0);
    },
  };
  return app;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
};

const OCTET_STREAM = 'application/octet-stream';

const rawPathOf = (req) => req.url.split('?')[0];

export function safeJoin(rootDir, urlPath) {
  throw new Error('TODO');
}

export function staticFiles(rootDir) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a throwaway tree, deleted again in a finally.
//
//   <tmp>/secret.txt        'top secret'      ← OUTSIDE the served root
//   <tmp>/public/index.html '<h1>home</h1>'   ← the root
//   <tmp>/public/style.css
//   <tmp>/public/notes/deep.txt
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withFixtures(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  const publicDir = path.join(dir, 'public');
  await fs.mkdir(path.join(publicDir, 'notes'), { recursive: true });
  await fs.writeFile(path.join(dir, 'secret.txt'), 'top secret', 'utf8');
  await fs.writeFile(path.join(publicDir, 'index.html'), '<h1>home</h1>', 'utf8');
  await fs.writeFile(path.join(publicDir, 'style.css'), 'body { color: red }', 'utf8');
  await fs.writeFile(path.join(publicDir, 'notes', 'deep.txt'), 'deep file', 'utf8');
  try {
    return await run(publicDir, dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

function appServing(publicDir) {
  const app = createApp();
  app.use(staticFiles(publicDir));
  app.use((req, res) => sendJson(res, 404, { error: 'no such route' }));
  return app;
}

test('safeJoin resolves a normal path inside the root', () => {
  const root = path.resolve('/srv/public');
  eq(safeJoin(root, '/index.html'), path.join(root, 'index.html'));
  eq(safeJoin(root, '/notes/deep.txt'), path.join(root, 'notes', 'deep.txt'));
  eq(safeJoin(root, '/'), root);
});

test('safeJoin refuses to climb out of the root', () => {
  const root = path.resolve('/srv/public');
  eq(safeJoin(root, '/../secret.txt'), null);
  eq(safeJoin(root, '/notes/../../secret.txt'), null);
});

test('safeJoin refuses an encoded climb', () => {
  const root = path.resolve('/srv/public');
  eq(safeJoin(root, '/%2e%2e/secret.txt'), null);
  eq(safeJoin(root, '/..%2fsecret.txt'), null);
  eq(safeJoin(root, '/%2e%2e%2fsecret.txt'), null);
});

test('a directory serves its index.html', async () => {
  await withFixtures(async (publicDir) => {
    await withServer(appServing(publicDir).handler, async (request) => {
      const res = await request('/');
      eq(res.status, 200);
      eq(res.body, '<h1>home</h1>');
      eq(res.headers.get('content-type'), 'text/html; charset=utf-8');
    });
  });
});

test('the content-type comes from the extension', async () => {
  await withFixtures(async (publicDir) => {
    await withServer(appServing(publicDir).handler, async (request) => {
      const css = await request('/style.css');
      eq(css.status, 200);
      eq(css.body, 'body { color: red }');
      eq(css.headers.get('content-type'), 'text/css; charset=utf-8');
      eq(css.headers.get('content-length'), '19');
    });
  });
});

test('nested files are served too', async () => {
  await withFixtures(async (publicDir) => {
    await withServer(appServing(publicDir).handler, async (request) => {
      const res = await request('/notes/deep.txt');
      eq(res.status, 200);
      eq(res.body, 'deep file');
      eq(res.headers.get('content-type'), 'text/plain; charset=utf-8');
    });
  });
});

test('a path with no file behind it falls through to the routes', async () => {
  await withFixtures(async (publicDir) => {
    await withServer(appServing(publicDir).handler, async (request) => {
      const res = await request('/nope.txt');
      eq(res.status, 404);
      eq(res.json(), { error: 'no such route' });
    });
  });
});

test('the ../ attack is refused and the secret never leaks', async () => {
  await withFixtures(async (publicDir) => {
    await withServer(appServing(publicDir).handler, async (request, raw) => {
      const climb = await raw('/../secret.txt');
      eq(climb.status, 403);
      ok(!climb.body.includes('top secret'));

      const deeper = await raw('/notes/../../secret.txt');
      eq(deeper.status, 403);

      const encoded = await request('/..%2fsecret.txt');
      eq(encoded.status, 403);
      ok(!encoded.body.includes('top secret'));
    });
  });
});
