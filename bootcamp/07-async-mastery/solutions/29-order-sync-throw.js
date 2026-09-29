// ─────────────────────────────────────────────────────────────────────────
//  29 · order · a throw inside a then chain — SOLUTION      ★★☆ core
//  run: node 29-order-sync-throw.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the sync pass prints 'script start' and 'script end'.
//  Then the microtask queue is drained one TICK at a time, and because
//  both chains were built in the same tick the second one is a ruler you
//  can read the first one against.
//  tick 1: 'then 1' runs and throws — the chain is now rejected — and
//          'other A' runs.
//  tick 2: the `.then(() => log('then 2'))` has no onRejected handler, so
//          it forwards the rejection and logs NOTHING. It still burns a
//          tick: 'other B' is all you see.
//  tick 3: '.catch' finally sees the error → 'catch boom', plus 'other C'.
//  tick 4: the catch returned undefined, so the chain is fulfilled again
//          and 'then 3' runs.
//  That is the lesson: a skipped handler is not free. Every link in a
//  chain — handling or forwarding — costs one microtask hop, which is why
//  a five-link chain lands five ticks late even when four links do nothing.
//  Wrong turn: expecting 'then 2' to appear because "the throw was caught
//  later". A throw inside a handler rejects THAT link's promise; every
//  onFulfilled below it is skipped until a rejection handler appears.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 8) resolve(out); // all eight logs are in
    };
    log('script start');
    Promise.resolve()
      .then(() => {
        log('then 1');
        throw new Error('boom');
      })
      .then(() => log('then 2'))
      .catch((e) => log(`catch ${e.message}`))
      .then(() => log('then 3'));
    Promise.resolve()
      .then(() => log('other A'))
      .then(() => log('other B'))
      .then(() => log('other C'));
    log('script end');
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [
  'script start',
  'script end',
  'then 1',
  'other A',
  'other B',
  'catch boom',
  'other C',
  'then 3',
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

test('leaves out the handler the rejection skips', async () => {
  requireAnswer();
  const real = await capture();
  eq(
    answer.filter((s) => !real.includes(s)),
    []
  );
});

test('lists every log exactly once', async () => {
  requireAnswer();
  const real = await capture();
  eq([...answer].sort(), [...real].sort());
});

test('puts the catch on the right tick of the other chain', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('catch boom'), real.indexOf('catch boom'));
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
