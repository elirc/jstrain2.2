// ─────────────────────────────────────────────────────────────────────────
//  30 · degrade on purpose — SOLUTION                       ★★★ stretch
//  run: node 30-graceful-degradation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a plain `for...of` with `await` inside is the right
//  shape here — the sources are tried in ORDER and later ones must not
//  run at all once one works, which is exactly what Promise.any (or a
//  `map`) would get wrong by starting everything at once.
//  Two kinds of miss share one path. A throw or rejection contributes
//  its message; a resolved `undefined` contributes 'no data'. The `if
//  (value !== undefined)` test — rather than `if (value)` — is what
//  keeps `null`, `0` and `''` as real answers (the README's rule 5).
//  `reasons` is the whole point of the exercise. A fallback chain
//  without it is indistinguishable from a healthy system: the value
//  arrives, nobody logs anything, and you find out in a week that the
//  API has been down since Tuesday. Returning the reasons alongside the
//  value lets the caller log, alert or badge the response as degraded.
//  The final Error carries both: `.reasons` for the whole story and
//  `.cause` for the last real failure, so a stack trace still exists.
//  Classic wrong turn: `try { primary() } catch { return DEFAULTS }`.
//  It works, it is invisible, and it is the reason "it was fine in
//  prod" and "prod has been serving defaults" can both be true.

import { test, eq, ok, spy } from '../../_lib/check.js';

export async function withFallbacks(sources) {
  const reasons = [];
  let lastError;
  for (const source of sources) {
    try {
      const value = await source.load();
      if (value !== undefined) {
        return { value, source: source.name, reasons };
      }
      reasons.push({ source: source.name, reason: 'no data' });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      reasons.push({ source: source.name, reason: lastError.message });
    }
  }
  const failure = new Error(
    'all sources failed',
    lastError ? { cause: lastError } : undefined
  );
  failure.reasons = reasons;
  throw failure;
}

// ── given: test fixtures & helpers ───────────────────────────────────────

const source = (name, load) => ({ name, load });

// returns the error an async fn rejected with, so a test can inspect it
async function rejectedBy(fn) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to reject, but it resolved');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the first working source wins and is named', async () => {
  const result = await withFallbacks([
    source('api', async () => ({ theme: 'dark' })),
    source('cache', async () => ({ theme: 'light' })),
  ]);
  eq(result.value, { theme: 'dark' });
  eq(result.source, 'api');
  eq(result.reasons, []);
});

test('later sources never run once one works', async () => {
  const cache = spy(async () => 'cached');
  await withFallbacks([
    source('api', async () => 'live'),
    source('cache', cache),
  ]);
  eq(cache.callCount, 0);
});

test('a rejection falls through, and is recorded', async () => {
  const result = await withFallbacks([
    source('api', async () => {
      throw new Error('HTTP 503');
    }),
    source('cache', async () => 'cached'),
  ]);
  eq(result.value, 'cached');
  eq(result.source, 'cache');
  eq(result.reasons, [{ source: 'api', reason: 'HTTP 503' }]);
});

test('undefined is a miss, not a success', async () => {
  const result = await withFallbacks([
    source('cache', async () => undefined),
    source('defaults', async () => ({ theme: 'light' })),
  ]);
  eq(result.source, 'defaults');
  eq(result.reasons, [{ source: 'cache', reason: 'no data' }]);
});

test('null IS data — a source may legitimately return it', async () => {
  const result = await withFallbacks([
    source('db', async () => null),
    source('defaults', async () => 'never'),
  ]);
  eq(result.value, null);
  eq(result.source, 'db');
});

test('reasons keep the order the sources were tried in', async () => {
  const result = await withFallbacks([
    source('api', async () => {
      throw new Error('HTTP 503');
    }),
    source('cache', async () => undefined),
    source('defaults', async () => 'bundled'),
  ]);
  eq(result.reasons, [
    { source: 'api', reason: 'HTTP 503' },
    { source: 'cache', reason: 'no data' },
  ]);
});

test('when everything misses it throws, carrying every reason', async () => {
  const err = await rejectedBy(() =>
    withFallbacks([
      source('api', async () => {
        throw new Error('HTTP 503');
      }),
      source('cache', async () => undefined),
    ])
  );
  eq(err.message, 'all sources failed');
  eq(err.reasons.length, 2);
});

test('a sync throw is a miss, and the last error is the cause', async () => {
  const boom = new Error('config file is gone');
  const err = await rejectedBy(() =>
    withFallbacks([
      source('api', async () => undefined),
      source('disk', () => {
        throw boom;
      }),
    ])
  );
  ok(err.cause === boom);
  eq(err.reasons[1], { source: 'disk', reason: 'config file is gone' });
});
