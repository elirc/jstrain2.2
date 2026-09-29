// ─────────────────────────────────────────────────────────────────────────
//  11 · greetFrom (errors skip to the catch) — SOLUTION    ★★☆ core
//  run: node 11-error-tunnel.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `.then(parse).then(pick).then(greet).catch(fallback)`.
//  Each .then registers a FULFILLED handler only; when the promise
//  before it is rejected, that handler is skipped and the rejection is
//  passed down the chain untouched until something handles it.
//  So a throw inside parse means pick and greet never run — the spies
//  prove it — and .catch sees parse's SyntaxError. Compare with
//  callbacks, where every level needed its own `if (err) return cb(err)`.
//  Wrong turn: `.catch` in the MIDDLE of the chain. It would recover
//  there and let the later steps run with a fallback value.

import { test, eq, ok, spy } from '../../_lib/check.js';

export const parse = spy((raw) => JSON.parse(raw));
export const pick = spy((obj) => obj.name.toUpperCase());
export const greet = spy((name) => `hello ${name}`);

const resetSpies = () => {
  for (const s of [parse, pick, greet]) {
    s.calls.length = 0;
    s.callCount = 0;
  }
};

export function greetFrom(raw) {
  return Promise.resolve(raw)
    .then(parse)
    .then(pick)
    .then(greet)
    .catch((err) => `could not greet (${err.name})`);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runs all three steps on good input', async () => {
  resetSpies();
  eq(await greetFrom('{"name":"ada"}'), 'hello ADA');
  eq([parse.callCount, pick.callCount, greet.callCount], [1, 1, 1]);
});

test('a throw in step one lands in the catch', async () => {
  resetSpies();
  eq(await greetFrom('not json'), 'could not greet (SyntaxError)');
});

test('skips every later step after a failure', async () => {
  resetSpies();
  await greetFrom('not json');
  eq([pick.callCount, greet.callCount], [0, 0]);
});

test('a failure in the middle step also reaches the catch', async () => {
  resetSpies();
  eq(await greetFrom('{"id":1}'), 'could not greet (TypeError)');
});

test('the step before the failure still ran', async () => {
  resetSpies();
  await greetFrom('{"id":1}');
  eq([parse.callCount, greet.callCount], [1, 0]);
});

test('the caught chain resolves instead of rejecting', async () => {
  resetSpies();
  const label = await greetFrom('nope').then(
    (v) => v,
    () => 'REJECTED'
  );
  ok(label !== 'REJECTED', '.catch should absorb the rejection');
});
