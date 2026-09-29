// ─────────────────────────────────────────────────────────────────────────
//  37 · a pipeline that can bail out                       ★★☆ core
//  concepts: pipelines · early exit · nullish checks
//  run: node 37-pipeline-early-exit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `pipe` runs every step no matter what. Real lookup chains give up
//  halfway: no user, so no address, so no city. Build the pipeline that
//  stops the moment a step hands back `null` or `undefined`.
//
//      const cityOfUser = pipeSafe(findUser, addressOf, cityOf);
//      cityOfUser(1)     → 'london'
//      cityOfUser(99)    → null        // findUser missed; nothing else ran
//
//      pipeSafeWith('unknown', findUser, addressOf, cityOf)(99)  → 'unknown'
//
//  Only null and undefined stop the chain. `0`, `''` and `false` are
//  perfectly good values and must flow straight through. A nullish input
//  must not reach the first step at all.
//
//  hint: `value == null` — the one place a loose `==` is the right tool,
//  because it means "null or undefined" and nothing else

import { test, eq, ok, spy } from '../../_lib/check.js';

export function pipeSafe(...steps) {
  throw new Error('TODO');
}

export function pipeSafeWith(fallback, ...steps) {
  throw new Error('TODO');
}

// ── given: three lookup steps — a miss returns null ──
const users = { 1: { name: 'ada', addressId: 7 } };
const addresses = { 7: { city: 'london' } };
const findUser = (id) => users[id] ?? null;
const addressOf = (user) => addresses[user.addressId] ?? null;
const cityOf = (address) => address.city;

// ──────────────────────────── tests ──────────────────────────────────────

test('runs every step while the value keeps flowing', () => {
  const inc = (n) => n + 1;
  const dbl = (n) => n * 2;
  eq(pipeSafe(inc, dbl, inc)(3), 9);
});

test('stops at the first null and hands it back', () => {
  const later = spy((n) => n + 1);
  eq(pipeSafe(() => null, later)(1), null);
  eq(later.callCount, 0);
});

test('undefined stops the chain as well', () => {
  const later = spy((n) => n + 1);
  eq(pipeSafe(() => undefined, later)(1), undefined);
  eq(later.callCount, 0);
});

test('0, empty string and false are values, not bail-outs', () => {
  const seen = spy((v) => `saw ${JSON.stringify(v)}`);
  eq(pipeSafe(() => 0, seen)(1), 'saw 0');
  eq(pipeSafe(() => '', seen)(1), 'saw ""');
  eq(pipeSafe(() => false, seen)(1), 'saw false');
  eq(seen.callCount, 3);
});

test('a nullish input never reaches the first step', () => {
  const first = spy((n) => n + 1);
  eq(pipeSafe(first)(null), null);
  eq(pipeSafe(first)(undefined), undefined);
  eq(first.callCount, 0);
});

test('with no steps it is the identity', () => {
  eq(pipeSafe()(42), 42);
  eq(pipeSafe()(null), null);
});

test('the lookup chain finds a city, or gives up quietly', () => {
  const cityOfUser = pipeSafe(findUser, addressOf, cityOf);
  eq(cityOfUser(1), 'london');
  eq(cityOfUser(99), null);
});

test('pipeSafeWith swaps a bail-out for the fallback', () => {
  const city = pipeSafeWith('unknown', findUser, addressOf, cityOf);
  eq(city(1), 'london');
  eq(city(99), 'unknown');
  ok(pipeSafeWith('unknown', () => 0)(1) === 0, '0 is not a bail-out');
});
