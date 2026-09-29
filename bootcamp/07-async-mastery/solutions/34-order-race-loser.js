// ─────────────────────────────────────────────────────────────────────────
//  34 · order · the loser that rejects afterwards — SOLUTION  ★★☆ core
//  run: node 34-order-race-loser.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: 'script start', 'script end' — both timers are only
//  SCHEDULED during the sync pass. At 10ms the first timer callback runs
//  'winner settles' and resolves; the race's promise is now permanently
//  fulfilled, so on the very next microtask 'race → W' prints.
//  At 20ms the second timer still fires — race did not and cannot cancel
//  it — so 'loser rejects' prints and the loser promise rejects. The race
//  already settled, so its rejection handler is dead code: 'race rejected'
//  NEVER prints. The separate `.catch` on `loser` does run, one microtask
//  later: 'loser handled'.
//  Two production lessons in one snippet. First, a promise settles once;
//  the loser's outcome is silently dropped by the combinator. Second, that
//  dropped rejection is still a rejection — if nothing else were attached
//  to `loser`, Node would print UnhandledPromiseRejection and exit non-zero
//  long after your code "finished". (Here `Promise.race` itself attaches a
//  handler to every input, so it is covered — but the timer still holds
//  the process open for the full 20ms.)
//  Wrong turn: reading `race` as "cancel the others". Cancellation needs
//  an AbortController threaded into the losers.

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

export const answer = [
  'script start',
  'script end',
  'winner settles',
  'race → W',
  'loser rejects',
  'loser handled',
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
