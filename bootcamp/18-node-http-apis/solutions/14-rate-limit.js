// ─────────────────────────────────────────────────────────────────────────
//  14 · rate limiting — SOLUTION                             ★★★ stretch
//  run: node 14-rate-limit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a token bucket, which is what every rate limiter worth
//  using turns out to be. Each key owns a bucket of `capacity` tokens;
//  every request spends one; tokens drip back at a fixed rate. Two
//  properties fall out for free: a burst up to the bucket size is fine
//  (users do arrive in bursts), and the long-run average is exactly the
//  refill rate.
//  The trick is that nothing ticks. There is no timer refilling buckets —
//  you compute the refill lazily on the next request from the elapsed
//  time. A million idle keys cost a million map entries and zero CPU,
//  where a timer per key would melt the process.
//  Clamp with Math.min(capacity, ...) or an account that went quiet for a
//  week comes back holding 604,800 tokens.
//  `now` is a parameter for the same reason as in exercise 06: the test
//  advances time by 2000ms instantly instead of sleeping, and the suite
//  stays fast and deterministic. Injecting the clock is the single
//  highest-leverage habit in testing time-dependent code.
//  429 is the status; Retry-After is the courtesy. Without it the client
//  has no idea whether to come back in a second or an hour, so it retries
//  immediately and makes the overload worse.
//  A single-process Map is fine for one server. Two servers behind a load
//  balancer means two buckets and double the allowance — which is why
//  production limiters keep the counter in Redis.

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
  const capacity = options.capacity ?? 5;
  const refillPerSecond = options.refillPerSecond ?? 1;
  const now = options.now ?? Date.now;
  const keyOf = options.keyOf ?? ((req) => req.socket.remoteAddress);
  const buckets = new Map();

  return (req, res, next) => {
    const key = keyOf(req);
    const at = now();
    const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: at };

    const elapsed = Math.max(0, at - bucket.updatedAt);
    bucket.tokens = Math.min(
      capacity,
      bucket.tokens + (elapsed / 1000) * refillPerSecond
    );
    bucket.updatedAt = at;
    buckets.set(key, bucket);

    if (bucket.tokens < 1) {
      const waitSeconds = (1 - bucket.tokens) / refillPerSecond;
      res.setHeader('retry-after', String(Math.ceil(waitSeconds)));
      res.setHeader('x-ratelimit-remaining', '0');
      return sendJson(res, 429, { error: 'too many requests' });
    }

    bucket.tokens -= 1;
    res.setHeader('x-ratelimit-remaining', String(Math.floor(bucket.tokens)));
    next();
  };
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
