// ─────────────────────────────────────────────────────────────────────────
//  34 · order · the loser that rejects afterwards           ★★☆ core
//  concepts: Promise.race · settle-once · timers vs microtasks
//  run: node 34-order-race-loser.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A race between a 10ms winner and a 20ms loser that BLOWS UP when it
//  finally answers:
//
//      log('script start');
//      const winner = new Promise((res) =>
//        setTimeout(() => { log('winner settles'); res('W'); }, 10));
//      const loser = new Promise((_, rej) =>
//        setTimeout(() => { log('loser rejects');
//                           rej(new Error('too late')); }, 20));
//      Promise.race([winner, loser]).then(
//        (v) => log(`race → ${v}`),
//        () => log('race rejected'));
//      loser.catch(() => log('loser handled'));
//      log('script end');
//
//  Six of those seven log calls happen. Fill in `answer` in order:
//
//      export const answer = ['script start', ...];
//
//  hint: race does not cancel anything. The loser keeps running, keeps
//  its own timer alive, and still rejects — into a promise nobody is
//  waiting on any more.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 6) resolve(out); // all six logs are in
    };
    log('script start');
    const winner = new Promise((res) =>
      setTimeout(() => {
        log('winner settles');
        res('W');
      }, 10)
    );
    const loser = new Promise((_, rej) =>
      setTimeout(() => {
        log('loser rejects');
        rej(new Error('too late'));
      }, 20)
    );
    Promise.race([winner, loser]).then(
      (v) => log(`race → ${v}`),
      () => log('race rejected')
    );
    loser.catch(() => log('loser handled'));
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

test('knows which side of the race settles it', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('race rejected'), real.indexOf('race rejected'));
});

test('knows the loser still rejects after the race is over', async () => {
  requireAnswer();
  const real = await capture();
  eq(answer.indexOf('loser rejects'), real.indexOf('loser rejects'));
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
