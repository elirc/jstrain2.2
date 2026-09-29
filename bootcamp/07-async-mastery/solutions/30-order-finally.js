// ─────────────────────────────────────────────────────────────────────────
//  30 · order · finally is not a cheap then — SOLUTION      ★★☆ core
//  run: node 30-order-finally.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: sync first — 'script start', 'script end'. Then tick 1
//  runs both first handlers in registration order: 'finally A', 't1'.
//  Now the expensive part. `.finally(cb)` is specified roughly as
//      .then(v => Promise.resolve(cb()).then(() => v),
//            e => Promise.resolve(cb()).then(() => { throw e; }))
//  so after cb runs it RETURNS A PROMISE from the handler, and adopting a
//  promise returned by a handler costs two extra microtask hops (one job
//  to call its .then, one to deliver the result). The rejection therefore
//  reaches '.catch' on tick 4, not tick 2 — 'catch nope' lands next to
//  't4', three ticks behind 't1'. The catch resolves normally, so the
//  second 'finally B' handler fires on tick 5 alongside 't5'.
//  The lesson: `.finally` is a pass-through in VALUE, not in TIME. Sprinkle
//  five of them through a chain and you have added ~15 microtask hops.
//  Wrong turn: expecting 'catch nope' at 't2'. That is what you would get
//  with `.then(undefined, cb)`; `finally` pays for the promise it wraps
//  cb's return value in.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 10) resolve(out); // all ten logs are in
    };
    log('script start');
    Promise.reject(new Error('nope'))
      .finally(() => log('finally A'))
      .catch((e) => log(`catch ${e.message}`))
      .finally(() => log('finally B'));
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

export const answer = [
  'script start',
  'script end',
  'finally A',
  't1',
  't2',
  't3',
  'catch nope',
  't4',
  'finally B',
  't5',
];

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

test('keeps the t1..t5 counter in order', async () => {
  requireAnswer();
  eq(
    answer.filter((s) => /^t\d$/.test(s)),
    ['t1', 't2', 't3', 't4', 't5']
  );
});

test('knows how many ticks the first finally costs the catch', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('catch nope'), real.indexOf('catch nope'));
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
