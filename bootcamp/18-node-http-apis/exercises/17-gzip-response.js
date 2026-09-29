// ─────────────────────────────────────────────────────────────────────────
//  17 · gzip responses                                          ★★☆ core
//  concepts: zlib · Accept-Encoding · Content-Encoding · Vary
//  run: node 17-gzip-response.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Repetitive JSON compresses to a fraction of its size, and every
//  browser already speaks gzip. Compress — but only when the client said
//  it can decompress.
//
//      acceptsGzip('gzip, deflate, br') → true
//      acceptsGzip('deflate')           → false
//      acceptsGzip('gzip;q=0')          → false   (q=0 is a refusal)
//      acceptsGzip(undefined)           → false
//
//      await sendMaybeGzipped(req, res, 200, body, contentType, opts)
//        · client accepts gzip and the body is at least opts.threshold
//          bytes (default 0) → gzip it, set content-encoding: gzip and
//          content-length of the COMPRESSED bytes
//        · otherwise → send it as it is
//        · either way → vary: Accept-Encoding
//
//  hint: promisify(zlib.gzip) — gzipSync would block the event loop for
//  every other connection in the process

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzip = promisify(zlib.gzip);

// Provided: a loopback harness whose `raw()` client sends the exact
// Accept-Encoding you ask for and hands back the UNTOUCHED bytes.
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
  const request = async (path = '/', init) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, init);
    const body = await res.text();
    check();
    return { status: res.status, headers: res.headers, body };
  };
  const raw = (path = '/', headers = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path, headers }, (res) => {
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
            body: Buffer.concat(chunks),
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
  try {
    return await run(raw, request);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

export function acceptsGzip(header) {
  throw new Error('TODO');
}

export async function sendMaybeGzipped(
  req,
  res,
  status,
  body,
  contentType,
  options = {}
) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// A body worth compressing: repetitive JSON, like most API responses.
const PAYLOAD = JSON.stringify({
  notes: Array.from({ length: 40 }, (unused, i) => ({ id: i, text: 'buy milk' })),
});

function jsonHandler(options) {
  return (req, res) =>
    sendMaybeGzipped(req, res, 200, PAYLOAD, 'application/json; charset=utf-8', options);
}

test('acceptsGzip reads the Accept-Encoding header', () => {
  eq(acceptsGzip('gzip'), true);
  eq(acceptsGzip('gzip, deflate, br'), true);
  eq(acceptsGzip('deflate'), false);
  eq(acceptsGzip(''), false);
  eq(acceptsGzip(undefined), false);
});

test('a q of zero is a refusal', () => {
  eq(acceptsGzip('gzip;q=0'), false);
  eq(acceptsGzip('gzip;q=0.5'), true);
  eq(acceptsGzip('deflate, gzip;q=0'), false);
});

test('a client that asks for gzip gets gzip bytes', async () => {
  await withServer(jsonHandler(), async (raw) => {
    const res = await raw('/notes', { 'accept-encoding': 'gzip' });
    eq(res.status, 200);
    eq(res.headers['content-encoding'], 'gzip');
    eq(res.body[0], 0x1f, 'the gzip magic number');
    eq(res.body[1], 0x8b);
    eq(zlib.gunzipSync(res.body).toString('utf8'), PAYLOAD);
  });
});

test('compression actually made it smaller', async () => {
  await withServer(jsonHandler(), async (raw) => {
    const res = await raw('/notes', { 'accept-encoding': 'gzip' });
    ok(res.body.length < Buffer.byteLength(PAYLOAD), 'repetitive JSON compresses well');
    eq(res.headers['content-length'], String(res.body.length), 'the wire length');
  });
});

test('a client that cannot decompress gets the plain body', async () => {
  await withServer(jsonHandler(), async (raw) => {
    const res = await raw('/notes', { 'accept-encoding': 'identity' });
    eq(res.headers['content-encoding'], undefined);
    eq(res.body.toString('utf8'), PAYLOAD);
    eq(res.headers['content-length'], String(Buffer.byteLength(PAYLOAD)));
  });
});

test('Vary: Accept-Encoding is set either way', async () => {
  await withServer(jsonHandler(), async (raw) => {
    const zipped = await raw('/notes', { 'accept-encoding': 'gzip' });
    eq(zipped.headers.vary, 'Accept-Encoding');
    const plain = await raw('/notes', { 'accept-encoding': 'identity' });
    eq(plain.headers.vary, 'Accept-Encoding');
  });
});

test('a body under the threshold is not worth compressing', async () => {
  const tiny = (req, res) =>
    sendMaybeGzipped(req, res, 200, 'ok', 'text/plain; charset=utf-8', {
      threshold: 1024,
    });

  await withServer(tiny, async (raw) => {
    const res = await raw('/health', { 'accept-encoding': 'gzip' });
    eq(res.headers['content-encoding'], undefined);
    eq(res.body.toString('utf8'), 'ok');
  });
});

test('fetch decompresses for you — the header is how you know', async () => {
  await withServer(jsonHandler(), async (raw, request) => {
    const res = await request('/notes');
    eq(res.headers.get('content-encoding'), 'gzip');
    eq(res.body, PAYLOAD, 'undici gunzipped it on the way in');
  });
});
