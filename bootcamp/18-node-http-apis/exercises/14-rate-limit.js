// ─────────────────────────────────────────────────────────────────────────
//  14 · rate limiting                                        ★★★ stretch
//  concepts: token bucket · lazy refill · injected clocks · 429
//  run: node 14-rate-limit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A token bucket per client. Each key starts with `capacity` tokens,
//  every request spends one, and tokens drip back at `refillPerSecond`.
//  Run out and you get a 429 until one drips back.
//
//      rateLimit({ capacity: 2, refillPerSecond: 1, now, keyOf })
//
//      request 1, 2   → 200, x-ratelimit-remaining: 1 then 0
//      request 3      → 429 { error: 'too many requests' }
//                       retry-after: <whole seconds until one token>
//      clock +1000ms  → 200 again
//      clock +60000ms → still only `capacity` tokens, never more
//
//  Nothing ticks: there is no timer. Work out the refill from the time
//  elapsed since that bucket was last touched, the next time you see it.
//  A blocked request must not reach the rest of the chain.
//
//  hint: tokens = min(capacity, tokens + elapsedSeconds * refillPerSecond)
//  — and Retry-After is a whole number of seconds, so round up

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

// Provided: a clock you control. now() reads it, now.advance(ms) moves it.
function fakeClock(start = 0) {
  let time = start;
  const now = () => time;
  now.advance = (ms) => {
    time += ms;
  };
  return now;
}

export function rateLimit(options = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const byApiKey = (req) => req.headers['x-api-key'] ?? 'anonymous';

function appWith(limiter, reached = () => {}) {
  const app = createApp();
  app.use(limiter);
  app.use((req, res) => {
    reached();
    sendJson(res, 200, { ok: true });
  });
  return app;
}

const asKey = (key) => ({ headers: { 'x-api-key': key } });

test('a burst up to the bucket size is allowed', async () => {
  const limiter = rateLimit({
    capacity: 3,
    refillPerSecond: 1,
    now: fakeClock(),
    keyOf: byApiKey,
  });
  await withServer(appWith(limiter).handler, async (request) => {
    for (let i = 0; i < 3; i += 1) {
      eq((await request('/notes', asKey('ada'))).status, 200);
    }
  });
});

test('the request after that is a 429', async () => {
  const limiter = rateLimit({
    capacity: 2,
    refillPerSecond: 1,
    now: fakeClock(),
    keyOf: byApiKey,
  });
  await withServer(appWith(limiter).handler, async (request) => {
    await request('/notes', asKey('ada'));
    await request('/notes', asKey('ada'));
    const blocked = await request('/notes', asKey('ada'));
    eq(blocked.status, 429);
    eq(blocked.json(), { error: 'too many requests' });
  });
});

test('a blocked request never reaches the route', async () => {
  const reached = spy();
  const limiter = rateLimit({
    capacity: 1,
    refillPerSecond: 1,
    now: fakeClock(),
    keyOf: byApiKey,
  });
  await withServer(appWith(limiter, reached).handler, async (request) => {
    await request('/notes', asKey('ada'));
    await request('/notes', asKey('ada'));
    await request('/notes', asKey('ada'));
    eq(reached.callCount, 1);
  });
});

test('Retry-After says how long until one token is back', async () => {
  const limiter = rateLimit({
    capacity: 1,
    refillPerSecond: 0.5, // one token every two seconds
    now: fakeClock(),
    keyOf: byApiKey,
  });
  await withServer(appWith(limiter).handler, async (request) => {
    await request('/notes', asKey('ada'));
    const blocked = await request('/notes', asKey('ada'));
    eq(blocked.status, 429);
    eq(blocked.headers.get('retry-after'), '2');
  });
});

test('tokens come back as the clock moves', async () => {
  const now = fakeClock();
  const limiter = rateLimit({ capacity: 2, refillPerSecond: 1, now, keyOf: byApiKey });
  await withServer(appWith(limiter).handler, async (request) => {
    await request('/notes', asKey('ada'));
    await request('/notes', asKey('ada'));
    eq((await request('/notes', asKey('ada'))).status, 429);

    now.advance(1000); // one token drips back
    eq((await request('/notes', asKey('ada'))).status, 200);
    eq((await request('/notes', asKey('ada'))).status, 429);
  });
});

test('a long quiet period does not overfill the bucket', async () => {
  const now = fakeClock();
  const limiter = rateLimit({ capacity: 2, refillPerSecond: 1, now, keyOf: byApiKey });
  await withServer(appWith(limiter).handler, async (request) => {
    await request('/notes', asKey('ada'));
    now.advance(60_000); // a minute of silence — 60 tokens' worth
    eq((await request('/notes', asKey('ada'))).status, 200);
    eq((await request('/notes', asKey('ada'))).status, 200);
    eq((await request('/notes', asKey('ada'))).status, 429, 'capacity is the ceiling');
  });
});

test('buckets are per key — one noisy client does not block another', async () => {
  const limiter = rateLimit({
    capacity: 1,
    refillPerSecond: 1,
    now: fakeClock(),
    keyOf: byApiKey,
  });
  await withServer(appWith(limiter).handler, async (request) => {
    eq((await request('/notes', asKey('ada'))).status, 200);
    eq((await request('/notes', asKey('ada'))).status, 429);
    eq((await request('/notes', asKey('bob'))).status, 200);
  });
});

test('the remaining header counts down and bottoms out at 0', async () => {
  const limiter = rateLimit({
    capacity: 3,
    refillPerSecond: 1,
    now: fakeClock(),
    keyOf: byApiKey,
  });
  await withServer(appWith(limiter).handler, async (request) => {
    eq((await request('/notes', asKey('ada'))).headers.get('x-ratelimit-remaining'), '2');
    eq((await request('/notes', asKey('ada'))).headers.get('x-ratelimit-remaining'), '1');
    eq((await request('/notes', asKey('ada'))).headers.get('x-ratelimit-remaining'), '0');
    const blocked = await request('/notes', asKey('ada'));
    ok(blocked.status === 429);
    eq(blocked.headers.get('x-ratelimit-remaining'), '0');
  });
});
