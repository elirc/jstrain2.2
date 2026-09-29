// ─────────────────────────────────────────────────────────────────────────
//  28 · an error boundary for handlers — SOLUTION              ★★☆ core
//  run: node 28-handler-error-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two nets, because there are two ways a handler fails.
//  The try/catch covers the synchronous throw. The `then(undefined,
//  onRejected)` covers the asynchronous one — and it has to be there,
//  because by the time a returned promise rejects the try block has
//  long since finished. Forgetting it is the classic version of this
//  bug: the wrapper looks safe, the logs stay quiet, and one rejected
//  handler takes the whole process down as an unhandled rejection.
//  The wrapper deliberately does NOT make everything async. A sync
//  handler still returns its value synchronously, so a caller that
//  reads the return value keeps working; only a handler that already
//  returned a promise gets a promise back.
//  The logger is injected rather than imported. That is what makes this
//  testable — a spy in the test, a real transport in production — and
//  it is the same shape as the injected clock in exercise 21.
//  Note what the wrapper never does: rethrow. Swallowing is normally a
//  smell, but at a boundary with no caller who can act, logging IS the
//  handling. The line between the two is whether anyone upstream could
//  have done something with the error.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function safeHandler(handler, options = {}) {
  const { logger, name = handler.name || 'handler' } = options;

  const report = (thrown) => {
    const error =
      thrown instanceof Error ? thrown : new Error(String(thrown));
    logger.error({ handler: name, error });
    return undefined;
  };

  return (...args) => {
    try {
      const returned = handler(...args);
      if (typeof returned?.then === 'function') {
        return returned.then(undefined, report);
      }
      return returned;
    } catch (err) {
      return report(err);
    }
  };
}

// ── given: a logger you can assert against ───────────────────────────────

const makeLogger = () => ({ error: spy() });

// ──────────────────────────── tests ──────────────────────────────────────

test('passes the arguments through and returns the value', () => {
  const logger = makeLogger();
  const wrapped = safeHandler((a, b) => a + b, { logger });
  eq(wrapped(2, 3), 5);
  eq(logger.error.callCount, 0);
});

test('a throwing handler returns undefined instead of exploding', () => {
  const logger = makeLogger();
  const wrapped = safeHandler(() => {
    throw new Error('boom');
  }, { logger });
  eq(wrapped(), undefined);
});

test('it logs the failure once, with the name and the error', () => {
  const logger = makeLogger();
  function onSave() {
    throw new Error('boom');
  }
  safeHandler(onSave, { logger })();
  eq(logger.error.callCount, 1);
  eq(logger.error.calls[0][0].handler, 'onSave');
  eq(logger.error.calls[0][0].error.message, 'boom');
});

test('an async handler resolves to its value', async () => {
  const logger = makeLogger();
  const wrapped = safeHandler(async (n) => n * 2, { logger });
  eq(await wrapped(21), 42);
  eq(logger.error.callCount, 0);
});

test('a rejected async handler is caught too', async () => {
  const logger = makeLogger();
  const wrapped = safeHandler(async () => {
    throw new Error('network');
  }, { logger });
  eq(await wrapped(), undefined);
  eq(logger.error.callCount, 1);
  eq(logger.error.calls[0][0].error.message, 'network');
});

test('a non-Error throw is normalized before it is logged', () => {
  const logger = makeLogger();
  safeHandler(() => {
    throw 'just a string';
  }, { logger })();
  ok(logger.error.calls[0][0].error instanceof Error);
  eq(logger.error.calls[0][0].error.message, 'just a string');
});

test('one bad handler does not stop the others', () => {
  const logger = makeLogger();
  const seen = [];
  const handlers = [
    () => seen.push('first'),
    () => {
      throw new Error('second is broken');
    },
    () => seen.push('third'),
  ].map((handler) => safeHandler(handler, { logger }));
  for (const handler of handlers) handler({ type: 'save' });
  eq(seen, ['first', 'third']);
  eq(logger.error.callCount, 1);
});

test('an explicit name beats the function name', () => {
  const logger = makeLogger();
  function onSave() {
    throw new Error('boom');
  }
  safeHandler(onSave, { logger, name: 'save button' })();
  eq(logger.error.calls[0][0].handler, 'save button');
});
