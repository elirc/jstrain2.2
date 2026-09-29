// ─────────────────────────────────────────────────────────────────────────
//  11 · greetFrom (errors skip to the catch)               ★★☆ core
//  concepts: rejection propagation · .catch · skipped handlers
//  run: node 11-error-tunnel.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three steps, one catch. Chain parse → pick → greet on the raw input
//  and end with a single .catch that returns a fallback string:
//
//      greetFrom('{"name":"ada"}')  → 'hello ADA'
//      greetFrom('not json')        → 'could not greet (SyntaxError)'
//      greetFrom('{"id":1}')        → 'could not greet (TypeError)'
//
//  The fallback embeds the failed error's `.name`. Note what you do NOT
//  write: no error checks between the steps. A rejection skips every
//  later .then handler and lands in the first .catch — that is the
//  whole reason promise chains beat the callback pyramid.
//
//  hint: `.catch((err) => ...)` receives whichever error broke the chain

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
  throw new Error('TODO');
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
