// ─────────────────────────────────────────────────────────────────────────
//  28 · decorating an object — SOLUTION                        ★★★ stretch
//  concepts: decorator · object composition · wrapper ordering
//  run: node solutions/28-decorator-notifier-class.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — add behaviour to one object without touching its class and
//  without a subclass explosion (RetryingLoggingRateLimitedNotifier).
//  The contract is what makes them stack: a decorator takes an inner
//  object, exposes the SAME method signature, and returns the inner
//  result unchanged. Break any of those three and composition stops
//  working — a wrapper that swallows the error, renames a field or
//  returns `undefined` is where "it worked in staging" comes from.
//  The interesting result is the last two tests: identical objects, two
//  nestings, two different systems. Logging outside the retry answers
//  "did the user's email go out?"; logging inside answers "how flaky is
//  SMTP?". Wrapper order is a design decision, not a formatting one —
//  the same question decides whether your retry sits inside or outside
//  your timeout, your metric, your transaction.
//  Note this is composition, not inheritance: `RetryingNotifier` never
//  extends anything, it just holds an `inner` with a `send`. Duck typing
//  means the vendor client, a mock and another decorator are all
//  equally valid inners.
//  When NOT to use: one wrapper is fine, four is a stack trace nobody
//  can read — at that point make the concerns a pipeline with explicit
//  order (exercise 18). And never let a decorator change the return
//  type: a "retry" that makes a sync call async breaks every caller.
//  In the wild: `node-fetch` wrappers, Axios interceptors, opentelemetry
//  auto-instrumentation, java.io streams (BufferedInputStream), Polly /
//  resilience4j retry+circuit-breaker chains, Nest interceptors.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';

export class LoggingNotifier {
  constructor(inner, log) {
    this.inner = inner;
    this.log = log;
  }

  async send(to, message) {
    this.log('send', to);
    try {
      const result = await this.inner.send(to, message);
      this.log('ok', result.id);
      return result;
    } catch (error) {
      this.log('fail', error.message);
      throw error; // observe, never swallow
    }
  }
}

export class RetryingNotifier {
  constructor(inner, attempts = 3) {
    this.inner = inner;
    this.attempts = attempts;
  }

  async send(to, message) {
    let lastError;
    for (let attempt = 0; attempt < this.attempts; attempt += 1) {
      try {
        return await this.inner.send(to, message);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}

// the vendor client you are not allowed to edit
const makeSmtp = (failures = 0) => {
  let attempts = 0;
  return {
    send: spy(async (to, message) => {
      attempts += 1;
      if (attempts <= failures) throw new Error(`smtp down (${attempts})`);
      return { ok: true, id: `msg-${attempts}`, to };
    }),
  };
};

// ──────────────────────────── tests ──────────────────────────────────────

test('logging forwards the call and returns the result untouched', async () => {
  const smtp = makeSmtp();
  const wrapped = new LoggingNotifier(smtp, spy());
  eq(await wrapped.send('a@b.c', 'hi'), { ok: true, id: 'msg-1', to: 'a@b.c' });
  eq(smtp.send.calls, [['a@b.c', 'hi']]);
});

test('logging records the call and the outcome', async () => {
  const log = spy();
  await new LoggingNotifier(makeSmtp(), log).send('a@b.c', 'hi');
  eq(log.calls, [
    ['send', 'a@b.c'],
    ['ok', 'msg-1'],
  ]);
});

test('logging reports a failure and still rethrows it', async () => {
  const log = spy();
  const wrapped = new LoggingNotifier(makeSmtp(9), log);
  await rejects(() => wrapped.send('a@b.c', 'hi'), 'smtp down (1)');
  eq(log.calls, [
    ['send', 'a@b.c'],
    ['fail', 'smtp down (1)'],
  ]);
});

test('retrying keeps going until the send lands', async () => {
  const smtp = makeSmtp(2);
  const wrapped = new RetryingNotifier(smtp, 3);
  eq(await wrapped.send('a@b.c', 'hi'), { ok: true, id: 'msg-3', to: 'a@b.c' });
  eq(smtp.send.callCount, 3);
});

test('retrying gives up after the last attempt and rethrows it', async () => {
  const smtp = makeSmtp(9);
  const wrapped = new RetryingNotifier(smtp, 2);
  await rejects(() => wrapped.send('a@b.c', 'hi'), 'smtp down (2)');
  eq(smtp.send.callCount, 2);
});

test('logging outside the retry hides the attempts', async () => {
  const log = spy();
  const quiet = new LoggingNotifier(new RetryingNotifier(makeSmtp(2), 3), log);
  eq(await quiet.send('a@b.c', 'hi'), { ok: true, id: 'msg-3', to: 'a@b.c' });
  eq(log.calls, [
    ['send', 'a@b.c'],
    ['ok', 'msg-3'],
  ]);
});

test('logging inside the retry shows every attempt', async () => {
  const log = spy();
  const loud = new RetryingNotifier(new LoggingNotifier(makeSmtp(2), log), 3);
  eq(await loud.send('a@b.c', 'hi'), { ok: true, id: 'msg-3', to: 'a@b.c' });
  eq(log.calls, [
    ['send', 'a@b.c'],
    ['fail', 'smtp down (1)'],
    ['send', 'a@b.c'],
    ['fail', 'smtp down (2)'],
    ['send', 'a@b.c'],
    ['ok', 'msg-3'],
  ]);
});

test('a decorator keeps the interface it wraps', async () => {
  const wrapped = new RetryingNotifier(
    new LoggingNotifier(makeSmtp(), spy()),
    2
  );
  const result = await wrapped.send('x@y.z', 'hi');
  eq(Object.keys(result).sort(), ['id', 'ok', 'to']);
  eq(result.to, 'x@y.z');
  ok(typeof wrapped.send === 'function');
});
