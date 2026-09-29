// ─────────────────────────────────────────────────────────────────────────
//  06 · request logger                                       ★☆☆ warm-up
//  concepts: middleware · response events · injected dependencies
//  run: node 06-request-logger.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Your first real middleware: an access log. One line per finished
//  request, written through an injected `log` and timed with an injected
//  `now` so the test can read it back.
//
//      app.use(requestLogger({ log, now }));
//      GET /health   → log('GET /health 200 12ms')
//      POST /notes?draft=1 answered 201
//                    → log('POST /notes?draft=1 201 12ms')
//
//  The status and the duration are only known once the response is out,
//  so the line cannot be written on the way in. Call now() exactly twice
//  per request: once when it arrives, once when the response finishes.
//  The logger must not answer anything itself.
//
//  hint: res is an EventEmitter — res.on('finish', ...) fires after
//  res.end() has flushed

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';
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

// Provided: sendJson and the middleware runner from exercises 01 and 05.
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

// Provided: a clock that ticks a fixed amount every time you read it, so
// two reads per request always measure the same "duration".
function fakeClock(step = 12) {
  let time = 0;
  return () => {
    const value = time;
    time += step;
    return value;
  };
}

export function requestLogger({ log, now }) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const settle = () => sleep(20);

test('one finished request produces one log line', async () => {
  const log = spy();
  const app = createApp();
  app.use(requestLogger({ log, now: fakeClock() }));
  app.use((req, res) => sendJson(res, 200, { ok: true }));

  await withServer(app.handler, async (request) => {
    await request('/health');
    await settle();
    eq(log.callCount, 1);
    await request('/health');
    await settle();
    eq(log.callCount, 2);
  });
});

test('the line is method, url, status and duration', async () => {
  const log = spy();
  const app = createApp();
  app.use(requestLogger({ log, now: fakeClock(12) }));
  app.use((req, res) => sendJson(res, 200, { ok: true }));

  await withServer(app.handler, async (request) => {
    await request('/health');
    await settle();
    eq(log.calls[0][0], 'GET /health 200 12ms');
  });
});

test('the duration comes from the injected clock', async () => {
  const log = spy();
  const app = createApp();
  app.use(requestLogger({ log, now: fakeClock(5) }));
  app.use((req, res) => sendJson(res, 200, { ok: true }));

  await withServer(app.handler, async (request) => {
    await request('/health');
    await settle();
    ok(log.calls[0][0].endsWith(' 5ms'), 'read the clock once at each end');
  });
});

test('it logs the status the response actually ended with', async () => {
  const log = spy();
  const app = createApp();
  app.use(requestLogger({ log, now: fakeClock() }));

  await withServer(app.handler, async (request) => {
    eq((await request('/nope')).status, 404);
    await settle();
    eq(log.calls[0][0], 'GET /nope 404 12ms');
  });
});

test('the method and the query string are part of the line', async () => {
  const log = spy();
  const app = createApp();
  app.use(requestLogger({ log, now: fakeClock() }));
  app.use((req, res) => sendJson(res, 201, { ok: true }));

  await withServer(app.handler, async (request) => {
    await request('/notes?draft=1', { method: 'POST' });
    await settle();
    eq(log.calls[0][0], 'POST /notes?draft=1 201 12ms');
  });
});

test('the logger answers nothing itself — the chain carries on', async () => {
  const log = spy();
  const reached = spy();
  const app = createApp();
  app.use(requestLogger({ log, now: fakeClock() }));
  app.use((req, res) => {
    reached();
    sendJson(res, 200, { ok: true });
  });

  await withServer(app.handler, async (request) => {
    eq((await request('/')).json(), { ok: true });
    eq(reached.callCount, 1);
  });
});
