// ─────────────────────────────────────────────────────────────────────────
//  05 · middleware chain                                     ★★★ stretch
//  concepts: closures · control flow · the onion model
//  run: node 05-middleware-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `app.use()` is the idea the whole framework hangs on: a list of
//  functions, each handed (req, res, next), each free to answer the
//  request or pass it along. Build the runner.
//
//      const app = createApp();
//      app.use((req, res, next) => { req.user = 'ada'; next(); });
//      app.use((req, res) => sendJson(res, 200, { user: req.user }));
//      app.handler                     → an (req, res) http handler
//
//  Rules:
//    · run them in registration order; `use` returns the app
//    · next() moves to the following middleware
//    · a middleware that does not call next ends the chain
//    · calling next() twice must not run the rest of the chain twice
//    · once the response has been ended, next() goes nowhere
//    · falling off the end is a 404 { error: 'not found' }
//
//  hint: a recursive dispatch(index) plus a fresh `next` closure per step
//  — and one boolean per step to make next() idempotent

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

// Provided: sendJson from exercise 01.
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

export function createApp() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('middleware run in the order they were registered', async () => {
  const seen = [];
  const app = createApp();
  app.use((req, res, next) => {
    seen.push('first');
    next();
  });
  app.use((req, res, next) => {
    seen.push('second');
    next();
  });
  app.use((req, res) => sendJson(res, 200, { seen }));

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { seen: ['first', 'second'] });
  });
});

test('use() returns the app, so registrations chain', () => {
  const app = createApp();
  eq(app.use(() => {}), app);
});

test('a middleware that never calls next ends the chain', async () => {
  const later = spy();
  const app = createApp();
  app.use((req, res) => sendJson(res, 200, { from: 'first' }));
  app.use((req, res, next) => {
    later();
    next();
  });

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { from: 'first' });
    eq(later.callCount, 0);
  });
});

test('middleware can decorate the request for the ones after it', async () => {
  const app = createApp();
  app.use((req, res, next) => {
    req.user = { name: 'ada' };
    next();
  });
  app.use((req, res) => sendJson(res, 200, { user: req.user.name }));

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { user: 'ada' });
  });
});

test('reaching the end of the chain is a 404', async () => {
  const app = createApp();
  app.use((req, res, next) => next());
  app.use((req, res, next) => next());

  await withServer(app.handler, async (request) => {
    const res = await request('/anything');
    eq(res.status, 404);
    eq(res.json(), { error: 'not found' });
  });
});

test('an app with no middleware at all still answers', async () => {
  await withServer(createApp().handler, async (request) => {
    eq((await request('/')).status, 404);
  });
});

test('calling next() twice does not run the rest of the chain twice', async () => {
  const counted = spy();
  const app = createApp();
  app.use((req, res, next) => {
    next();
    next();
  });
  app.use((req, res) => {
    counted();
    if (!res.writableEnded) sendJson(res, 200, { ok: true });
  });

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { ok: true });
    eq(counted.callCount, 1);
  });
});

test('a middleware that already responded cannot re-open the chain', async () => {
  const later = spy();
  const app = createApp();
  app.use((req, res, next) => {
    sendJson(res, 202, { from: 'first' });
    next();
  });
  app.use((req, res, next) => {
    later();
    next();
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/');
    eq(res.status, 202);
    eq(later.callCount, 0);
  });
});
