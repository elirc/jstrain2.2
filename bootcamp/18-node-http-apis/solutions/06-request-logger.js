// ─────────────────────────────────────────────────────────────────────────
//  06 · request logger — SOLUTION                            ★☆☆ warm-up
//  run: node 06-request-logger.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is `morgan`, minus the format strings. The whole
//  lesson is *when* to log. Log at the top of the middleware and you can
//  print the method and the path but not the status or the duration —
//  they do not exist yet. So you take the start time, register a
//  listener for the response's 'finish' event, and call next()
//  immediately. The line gets written later, from the callback, once the
//  response really went out.
//  'finish' is the event that means "everything I passed to res.end() has
//  been handed to the OS". Its sibling 'close' fires even when the client
//  hung up mid-response, which is what you want for an error counter and
//  not what you want for an access log.
//  `log` and `now` are parameters, not imports. That is the only reason
//  this file can assert on exact output: injected dependencies turn
//  "check the console by hand" into a test. Reach for console.log or
//  Date.now() directly and the test has to compare against wall-clock
//  time, which is how flaky suites are born.

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
  return (req, res, next) => {
    const started = now();
    res.on('finish', () => {
      log(`${req.method} ${req.url} ${res.statusCode} ${now() - started}ms`);
    });
    next();
  };
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
