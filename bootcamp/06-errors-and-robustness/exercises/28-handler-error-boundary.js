// ─────────────────────────────────────────────────────────────────────────
//  28 · an error boundary for handlers                         ★★☆ core
//  concepts: never rethrow into the caller · injected loggers
//  run: node 28-handler-error-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An event emitter, a click listener, a message queue consumer: the
//  caller is a loop that knows nothing about your handler and has
//  nowhere to put an error. One bad subscriber must not stop the other
//  four, and it must not take the process down either — so wrap it.
//
//    safeHandler(handler, { logger, name }) → a function that never
//    throws and never rejects
//
//      · success → hands back whatever the handler returned
//      · a synchronous throw → log it, return undefined
//      · a REJECTED promise → log it, and the returned promise resolves
//        to undefined instead of rejecting
//      · the log call is exactly one `logger.error({ handler, error })`
//      · non-Error throws are normalized before they are logged
//      · `name` defaults to the handler function's own name
//
//  A try/catch around a call that RETURNS a promise catches nothing —
//  the function is long gone by the time it rejects, and in Node an
//  unhandled rejection ends the process. The promise path needs its own
//  net.
//
//  hint: `typeof value?.then === 'function'` tells you a promise came
//  back; `promise.then(undefined, onRejected)` is the net.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function safeHandler(handler, options = {}) {
  throw new Error('TODO');
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
