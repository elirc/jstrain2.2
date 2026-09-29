// ─────────────────────────────────────────────────────────────────────────
//  07 · async errors                                         ★★★ stretch
//  concepts: promises · error propagation · fail-safe responses
//  run: node 07-error-handler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A middleware can fail in three ways. All three must end up in one
//  place, or half your bugs answer 500 and the other half hang the
//  client forever. Extend the runner from exercise 05:
//
//      app.use(fn)          normal middleware, may be async
//      app.useError(fn)     (err, req, res, next) — the error handler
//      app.handler          the (req, res) handler
//
//      throw inside a middleware        ─┐
//      an async middleware that rejects ─┼→ the first error middleware
//      next(err)                        ─┘
//
//  Rules:
//    · an error skips every remaining normal middleware
//    · with no error middleware registered, answer 500
//      { error: 'internal server error' } — never the stack trace
//    · once the response has been sent, an error changes nothing
//
//  hint: a middleware call can return a promise — catch it the same way
//  you catch a synchronous throw, and route both into one `step(err)`

import { test, eq, ok, spy } from '../../_lib/check.js';
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

const boom = () => Object.assign(new Error('kaboom'), { status: 418 });

function appWithHandler(caught) {
  const app = createApp();
  app.useError((err, req, res, next) => {
    caught(err);
    sendJson(res, err.status ?? 500, { error: err.message });
  });
  return app;
}

test('a synchronous throw reaches the error middleware', async () => {
  const caught = spy();
  const app = createApp();
  app.use(() => {
    throw boom();
  });
  app.useError((err, req, res, next) => {
    caught(err);
    sendJson(res, 500, { error: err.message });
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/');
    eq(res.status, 500);
    eq(res.json(), { error: 'kaboom' });
    eq(caught.callCount, 1);
    ok(caught.calls[0][0] instanceof Error);
  });
});

test('a rejected async middleware lands in the same place', async () => {
  const caught = spy();
  const app = appWithHandler(caught);
  app.use(async () => {
    await Promise.resolve();
    throw new Error('async kaboom');
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/');
    eq(res.status, 500);
    eq(res.json(), { error: 'async kaboom' });
    eq(caught.callCount, 1);
  });
});

test('next(err) lands there too', async () => {
  const caught = spy();
  const app = appWithHandler(caught);
  app.use((req, res, next) => next(new Error('handed over')));

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { error: 'handed over' });
    eq(caught.callCount, 1);
  });
});

test('the error middleware sets the status from the error', async () => {
  const app = appWithHandler(spy());
  app.use(() => {
    throw boom();
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/');
    eq(res.status, 418);
    eq(res.json(), { error: 'kaboom' });
  });
});

test('an error skips every middleware that came after it', async () => {
  const later = spy();
  const app = appWithHandler(spy());
  app.use((req, res, next) => next(new Error('stop here')));
  app.use((req, res, next) => {
    later();
    next();
  });

  await withServer(app.handler, async (request) => {
    eq((await request('/')).status, 500);
    eq(later.callCount, 0);
  });
});

test('with no error middleware the client still gets a 500, not a hang', async () => {
  const app = createApp();
  app.use(async () => {
    throw new Error('secret database password in the stack trace');
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/');
    eq(res.status, 500);
    eq(res.json(), { error: 'internal server error' });
    ok(!res.body.includes('password'));
  });
});

test('a request that does not fail is untouched by any of this', async () => {
  const caught = spy();
  const app = appWithHandler(caught);
  app.use(async (req, res, next) => {
    await Promise.resolve();
    next();
  });
  app.use((req, res) => sendJson(res, 200, { ok: true }));

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { ok: true });
    eq(caught.callCount, 0);
  });
});

test('an async middleware that answers and then rejects cannot re-answer', async () => {
  const caught = spy();
  const app = appWithHandler(caught);
  app.use(async (req, res, next) => {
    sendJson(res, 200, { ok: true });
    await Promise.resolve();
    throw new Error('too late');
  });

  await withServer(app.handler, async (request) => {
    const res = await request('/');
    eq(res.status, 200);
    eq(res.json(), { ok: true });
    eq(caught.callCount, 0);
  });
});
