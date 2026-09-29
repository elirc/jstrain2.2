// ─────────────────────────────────────────────────────────────────────────
//  13 · CORS                                                    ★★☆ core
//  concepts: browser security model · preflight · Vary
//  run: node 13-cors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A page on https://app.test wants to call your API. The browser will
//  only hand it the response if your server says that origin is welcome.
//  Write the middleware that says so.
//
//      cors({ origins: ['https://app.test'],
//             methods: ['GET', 'POST', 'DELETE'],
//             headers: ['content-type', 'authorization'],
//             maxAge: 600 })
//
//    · Origin on the list  → access-control-allow-origin: <that origin>
//                            plus vary: Origin, then next()
//    · Origin not on it    → no CORS headers at all, then next()
//                            (the server still answers; the browser
//                            is what refuses to hand the page the body)
//    · no Origin header    → untouched, next()
//    · OPTIONS + access-control-request-method → this is a preflight:
//      answer 204 with an empty body, add allow-methods, allow-headers
//      and max-age when the origin is allowed, and NEVER call next()
//
//  hint: reflect the exact origin string you were sent — never echo it
//  without checking the list first

import { test, eq, spy } from '../../_lib/check.js';
import http from 'node:http';

// Provided: the loopback harness from exercise 01.
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
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path = '/', init) => {
    const res = await fetch(base + path, init);
    const body = await res.text();
    if (thrown.length) throw thrown.shift();
    return {
      status: res.status,
      headers: res.headers,
      body,
      json: () => JSON.parse(body),
    };
  };
  try {
    return await run(request, base);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

// Provided: sendJson (01) and the middleware runner (05).
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
        stack[index](req, res, next);
      };
      dispatch(0);
    },
  };
  return app;
}

export function cors(options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const ALLOWED = 'https://app.test';
const EVIL = 'https://evil.test';

function appWith(reached = () => {}) {
  const app = createApp();
  app.use(
    cors({
      origins: [ALLOWED, 'http://localhost:5173'],
      methods: ['GET', 'POST', 'DELETE'],
      headers: ['content-type', 'authorization'],
      maxAge: 600,
    })
  );
  app.use((req, res) => {
    reached(req.method);
    sendJson(res, 200, { notes: [] });
  });
  return app;
}

const preflight = (origin, method = 'DELETE') => ({
  method: 'OPTIONS',
  headers: { origin, 'access-control-request-method': method },
});

test('an allowed origin is reflected back exactly', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', { headers: { origin: ALLOWED } });
    eq(res.status, 200);
    eq(res.headers.get('access-control-allow-origin'), ALLOWED);
    eq(res.json(), { notes: [] });
  });
});

test('an origin that is not on the list gets no permission slip', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', { headers: { origin: EVIL } });
    eq(res.status, 200, 'the server still answers — the browser is the one that blocks');
    eq(res.headers.get('access-control-allow-origin'), null);
  });
});

test('Vary: Origin goes with the reflected header', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', { headers: { origin: ALLOWED } });
    eq(res.headers.get('vary'), 'Origin');
  });
});

test('a request with no Origin at all is untouched', async () => {
  const reached = spy();
  await withServer(appWith(reached).handler, async (request) => {
    const res = await request('/notes');
    eq(res.status, 200);
    eq(res.headers.get('access-control-allow-origin'), null);
    eq(reached.callCount, 1);
  });
});

test('a preflight is answered 204 with the methods and headers allowed', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', preflight(ALLOWED));
    eq(res.status, 204);
    eq(res.body, '');
    eq(res.headers.get('access-control-allow-origin'), ALLOWED);
    eq(res.headers.get('access-control-allow-methods'), 'GET, POST, DELETE');
    eq(res.headers.get('access-control-allow-headers'), 'content-type, authorization');
  });
});

test('the preflight caches for max-age seconds', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', preflight(ALLOWED));
    eq(res.headers.get('access-control-max-age'), '600');
  });
});

test('a preflight never reaches the route handler', async () => {
  const reached = spy();
  await withServer(appWith(reached).handler, async (request) => {
    await request('/notes', preflight(ALLOWED));
    eq(reached.callCount, 0);
    await request('/notes', { headers: { origin: ALLOWED } });
    eq(reached.callCount, 1);
  });
});

test('a preflight from an unknown origin gets 204 and nothing else', async () => {
  await withServer(appWith().handler, async (request) => {
    const res = await request('/notes', preflight(EVIL));
    eq(res.status, 204);
    eq(res.headers.get('access-control-allow-origin'), null);
    eq(res.headers.get('access-control-allow-methods'), null);
  });
});
