// ─────────────────────────────────────────────────────────────────────────
//  28 · decorating an object                                  ★★★ stretch
//  concepts: decorator · object composition · wrapper ordering
//  run: node exercises/28-decorator-notifier-class.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 09 decorated functions. Here the thing you must not edit is
//  an OBJECT with a method — a vendor notifier client:
//
//      notifier.send(to, message) → Promise<{ ok, id, to }>   (may throw)
//
//  Write two wrappers that expose the same `send` and delegate inward:
//
//      new LoggingNotifier(inner, log)      // log(...) around the call
//      new RetryingNotifier(inner, attempts) // retry, rethrow the last
//
//  LoggingNotifier calls, in order:
//      log('send', to)              before delegating
//      log('ok', result.id)         after a successful send
//      log('fail', error.message)   on a failure — then rethrows
//
//  Because both take an inner notifier and are one themselves, they
//  nest — and the ORDER changes what you get:
//
//      new LoggingNotifier(new RetryingNotifier(smtp, 3), log)
//        → one log pair; retries are hidden inside
//      new RetryingNotifier(new LoggingNotifier(smtp, log), 3)
//        → every attempt shows up in the log
//
//  hint: a wrapper that changes the arguments, the return shape or the
//  throwing behaviour is not a decorator, it is a bug

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';

export class LoggingNotifier {
  constructor(inner, log) {
    this.inner = inner;
    this.log = log;
  }

  async send(to, message) {
    throw new Error('TODO');
  }
}

export class RetryingNotifier {
  constructor(inner, attempts = 3) {
    this.inner = inner;
    this.attempts = attempts;
  }

  async send(to, message) {
    throw new Error('TODO');
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
