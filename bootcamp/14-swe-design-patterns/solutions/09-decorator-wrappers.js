// ─────────────────────────────────────────────────────────────────────────
//  09 · function decorators — SOLUTION                          ★★☆ core
//  concepts: decorator · higher-order functions · composition
//  run: node solutions/09-decorator-wrappers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — add behaviour around a function without touching the
//  function, and keep the wrapper's signature identical so callers
//  cannot tell. Same shape in, same shape out: that is why they stack.
//  Two details make a wrapper transparent: forward `...args` unchanged,
//  and return whatever the inner call returned. `withRetry` also keeps
//  the *last* error rather than inventing a new one, so the stack the
//  caller sees is a real failure, not "retries exhausted".
//  When NOT to use: three wrappers deep and a stack trace becomes a wall
//  of anonymous frames; also a wrapper that changes the return type (a
//  promise where there was none) is a lie, not a decorator.
//  In the wild: Express middleware, React `memo`/`forwardRef`, lodash
//  `debounce`, `@Injectable`-style decorators, tracing SDKs.

import { test, eq, rejects, spy } from '../../_lib/check.js';

export function withLogging(fn, log) {
  return (...args) => {
    log('call', args);
    const result = fn(...args);
    log('return', result);
    return result;
  };
}

export function withTiming(fn, record, now = Date.now) {
  return (...args) => {
    const started = now();
    const result = fn(...args);
    record(now() - started);
    return result;
  };
}

export function withRetry(fn, attempts) {
  return async (...args) => {
    let lastError;
    for (let i = 0; i < attempts; i += 1) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };
}

const add = (a, b) => a + b;
const fakeClock = (...times) => {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)];
};

// ──────────────────────────── tests ──────────────────────────────────────

test('withLogging passes the result through untouched', () => {
  eq(withLogging(add, spy())(2, 3), 5);
});

test('withLogging records the arguments and the return value', () => {
  const log = spy();
  withLogging(add, log)(2, 3);
  eq(log.calls, [
    ['call', [2, 3]],
    ['return', 5],
  ]);
});

test('withTiming reports elapsed ms from the injected clock', () => {
  const record = spy();
  const timed = withTiming(add, record, fakeClock(100, 142));
  eq(timed(2, 3), 5);
  eq(record.calls, [[42]]);
});

test('withTiming works with any arity', () => {
  const record = spy();
  const shout = withTiming((s) => s.toUpperCase(), record, fakeClock(0, 3));
  eq(shout('hi'), 'HI');
  eq(record.calls, [[3]]);
});

test('withRetry survives transient failures', async () => {
  const flaky = spy(async () => {
    if (flaky.callCount < 3) throw new Error('flap');
    return 'ok';
  });
  eq(await withRetry(flaky, 5)(), 'ok');
  eq(flaky.callCount, 3);
});

test('withRetry gives up after the last attempt and rethrows', async () => {
  const boom = spy(async () => {
    throw new Error(`nope ${boom.callCount}`);
  });
  const wrapped = withRetry(boom, 2);
  await rejects(() => wrapped(), 'nope 2');
  eq(boom.callCount, 2);
});

test('decorators compose without knowing about each other', () => {
  const log = spy();
  const record = spy();
  const wrapped = withTiming(withLogging(add, log), record, fakeClock(0, 5));
  eq(wrapped(2, 3), 5);
  eq(log.calls, [
    ['call', [2, 3]],
    ['return', 5],
  ]);
  eq(record.calls, [[5]]);
});
