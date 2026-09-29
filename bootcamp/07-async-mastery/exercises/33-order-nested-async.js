// ─────────────────────────────────────────────────────────────────────────
//  33 · order · three async functions deep                  ★★☆ core
//  concepts: await · call stack vs microtasks · nesting cost
//  run: node 33-order-nested-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  a() awaits b(), b() awaits c(), and c() does nothing at all. t1..t5 is
//  the ruler:
//
//      const c = async () => { log('c'); };
//      const b = async () => { log('b start'); await c(); log('b end'); };
//      const a = async () => { log('a start'); await b(); log('a end'); };
//
//      log('script start');
//      a().then(() => log('a resolved'));
//      Promise.resolve()
//        .then(() => log('t1')).then(() => log('t2'))
//        .then(() => log('t3')).then(() => log('t4'))
//        .then(() => log('t5'));
//      log('script end');
//
//  Fill in `answer` with all thirteen logs in order:
//
//      export const answer = ['script start', ...];
//
//  hint: calling an async function runs its body NOW, up to the first
//  await — but each await level adds one tick on the way back out.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 13) resolve(out); // all thirteen logs are in
    };
    const c = async () => {
      log('c');
    };
    const b = async () => {
      log('b start');
      await c();
      log('b end');
    };
    const a = async () => {
      log('a start');
      await b();
      log('a end');
    };
    log('script start');
    a().then(() => log('a resolved'));
    Promise.resolve()
      .then(() => log('t1'))
      .then(() => log('t2'))
      .then(() => log('t3'))
      .then(() => log('t4'))
      .then(() => log('t5'));
    log('script end');
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [];

// ──────────────────────────── tests ──────────────────────────────────────

test('answer is a list of strings', () => {
  requireAnswer();
  ok(Array.isArray(answer) && answer.every((s) => typeof s === 'string'));
});

test('has one entry per log the snippet prints', async () => {
  requireAnswer();
  eq(answer.length, (await capture()).length);
});

test('lists every log exactly once', async () => {
  requireAnswer();
  const real = await capture();
  eq([...answer].sort(), [...real].sort());
});

test('runs all three bodies before script end', async () => {
  requireAnswer();
  const end = answer.indexOf('script end');
  ok(['a start', 'b start', 'c'].every((s) => answer.indexOf(s) < end));
});

test('unwinds the awaits one tick per level', async () => {
  requireAnswer();
  const real = await capture();
  eq(
    ['b end', 'a end', 'a resolved'].map((s) => answer.indexOf(s)),
    ['b end', 'a end', 'a resolved'].map((s) => real.indexOf(s))
  );
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
