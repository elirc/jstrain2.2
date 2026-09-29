// ─────────────────────────────────────────────────────────────────────────
//  07 · async errors — SOLUTION                              ★★★ stretch
//  run: node 07-error-handler.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three ways to fail, one destination. A middleware can
//  throw synchronously, return a promise that rejects, or hand you an
//  error through next(err) — and all three have to end up at the same
//  place, or half your failures answer with a 500 and the other half hang
//  the socket until the client times out.
//  Sync throws are a try/catch around the call. Rejections are the
//  interesting one: `fn(req, res, next)` returns a promise, so you attach
//  a .catch to it. Express 4 does NOT do this (that is the entire reason
//  `express-async-errors` exists, and why Express 5 was a breaking
//  change); Fastify and Koa do it for you. Fifteen characters of code,
//  years of production incidents.
//  `step` is shared by all three paths and is guarded by `called`, so a
//  middleware that calls next() and THEN rejects does not get to reopen a
//  request that has already moved on. That is the same idempotence rule
//  as exercise 05, now carrying an argument.
//  The four-argument signature (err, req, res, next) is how Express tells
//  error middleware from normal middleware — it literally checks
//  fn.length. Keeping them in a separate list is clearer and does the
//  same job.
//  Last resort matters: with no error middleware registered the client
//  still has to get an answer, and it must not be the stack trace.
//  Log the detail, send { error: 'internal server error' }.
//  And once the response has gone out, an error is a log line and
//  nothing else — `fail` returns immediately rather than trying to write
//  a second set of headers onto a finished response.

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
  const stack = [];
  const errorStack = [];

  const app = {
    use(fn) {
      stack.push(fn);
      return app;
    },

    useError(fn) {
      errorStack.push(fn);
      return app;
    },

    handler(req, res) {
      const fail = (err, index) => {
        if (res.writableEnded) return; // too late — the answer already went
        if (index >= errorStack.length) {
          if (!res.writableEnded) {
            sendJson(res, 500, { error: 'internal server error' });
          }
          return;
        }
        let called = false;
        const next = (nextErr) => {
          if (called) return;
          called = true;
          fail(nextErr ?? err, index + 1);
        };
        try {
          const result = errorStack[index](err, req, res, next);
          if (result && typeof result.then === 'function') {
            result.catch(() => fail(err, errorStack.length));
          }
        } catch {
          fail(err, errorStack.length);
        }
      };

      const dispatch = (index) => {
        if (index >= stack.length) {
          return sendJson(res, 404, { error: 'not found' });
        }
        let called = false;
        const step = (err) => {
          if (called) return;
          called = true;
          if (err) return fail(err, 0);
          if (res.writableEnded) return;
          dispatch(index + 1);
        };
        try {
          const result = stack[index](req, res, step);
          if (result && typeof result.then === 'function') {
            result.catch((err) => step(err ?? new Error('rejected')));
          }
        } catch (err) {
          step(err);
        }
      };

      dispatch(0);
    },
  };

  return app;
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
