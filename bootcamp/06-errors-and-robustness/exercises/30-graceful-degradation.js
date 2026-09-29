// ─────────────────────────────────────────────────────────────────────────
//  30 · degrade on purpose                                  ★★★ stretch
//  concepts: fallback chains · collected reasons · misses vs errors
//  run: node 30-graceful-degradation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The config service is down. You have a warm cache and a bundled
//  default, so the app can still start — but only if the fallback is
//  DELIBERATE. Silent degradation is how a service runs for three days
//  on stale defaults and nobody notices, so every step down has to
//  leave a reason behind.
//
//    withFallbacks(sources) — sources are tried in order:
//        [{ name: 'api', load }, { name: 'cache', load }, ...]
//
//    → { value, source, reasons }
//        value    the first real value
//        source   the name that produced it
//        reasons  one { source, reason } per source that was skipped,
//                 in the order they were tried
//
//    A source MISSES when it throws, rejects, or resolves to undefined.
//    The reason is the error's MESSAGE, or 'no data' when there was no
//    error. Everything missed → throw Error('all sources failed')
//    carrying .reasons, with the last real error as its .cause.
//
//      withFallbacks([apiThatIs503, emptyCache, bundledDefaults])
//          → { value: {...}, source: 'defaults', reasons: [
//                { source: 'api', reason: 'HTTP 503' },
//                { source: 'cache', reason: 'no data' } ] }
//
//  hint: `null` is data — a source is allowed to say "the value is
//  null". Only `undefined` means "I have nothing". Pick one and be
//  consistent, or callers will guess.

import { test, eq, ok, spy } from '../../_lib/check.js';

export async function withFallbacks(sources) {
  throw new Error('TODO');
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
