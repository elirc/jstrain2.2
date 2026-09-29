// ─────────────────────────────────────────────────────────────────────────
//  42 · switch fallthrough                                  ★☆☆ warm-up
//  concepts: switch · grouped cases · deliberate fallthrough · ===
//  run: node 42-switch-fallthrough.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A `case` with no body falls into the next one — that is how you group
//  labels, and it is the safe, everyday use:
//
//      permissionFor('GET')    → 'read'      (GET, HEAD, OPTIONS)
//      permissionFor('POST')   → 'write'     (POST, PUT, PATCH, DELETE)
//      permissionFor('get')    → 'unknown'   (matching is ===)
//
//  A `case` WITH a body that falls through is the rarer, deliberate kind:
//  each plan gets its own feature plus everything below it. Mark every
//  intentional fallthrough with a `// fallthrough` comment — that comment
//  is what tells the next reader (and the linter) you meant it.
//
//      featuresFor('pro')   → ['sso', 'reports', 'basic']
//      featuresFor('plus')  → ['reports', 'basic']
//      featuresFor('free')  → ['basic']
//      featuresFor('trial') → []
//
//  matchKind pins the comparison rule. Give it cases for 1, '1', true,
//  null and NaN, in that order, returning 'number one', 'string one',
//  'boolean', 'null' and 'never happens'; everything else is 'other'.
//
//      matchKind(1) → 'number one'      matchKind('1') → 'string one'
//      matchKind(NaN) → 'other'         ← the NaN case can never run

import { test, eq } from '../../_lib/check.js';

export function permissionFor(method) {
  throw new Error('TODO');
}

export function featuresFor(plan) {
  throw new Error('TODO');
}

export function matchKind(value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the read methods share one case body', () => {
  eq(permissionFor('GET'), 'read');
  eq(permissionFor('HEAD'), 'read');
  eq(permissionFor('OPTIONS'), 'read');
});

test('the write methods share another', () => {
  eq(permissionFor('POST'), 'write');
  eq(permissionFor('PUT'), 'write');
  eq(permissionFor('PATCH'), 'write');
  eq(permissionFor('DELETE'), 'write');
});

test('anything else is unknown, and case matters', () => {
  eq(permissionFor('TRACE'), 'unknown');
  eq(permissionFor('get'), 'unknown');
  eq(permissionFor(''), 'unknown');
  eq(permissionFor(undefined), 'unknown');
});

test('the top plan falls through every rung below it', () => {
  eq(featuresFor('pro'), ['sso', 'reports', 'basic']);
});

test('each lower plan starts further down the ladder', () => {
  eq(featuresFor('plus'), ['reports', 'basic']);
  eq(featuresFor('free'), ['basic']);
});

test('an unrecognised plan gets nothing at all', () => {
  eq(featuresFor('trial'), []);
  eq(featuresFor(undefined), []);
  eq(featuresFor('PRO'), []);
});

test('switch compares with === and never coerces', () => {
  eq(matchKind(1), 'number one');
  eq(matchKind('1'), 'string one');
  eq(matchKind(true), 'boolean');
  eq(matchKind(null), 'null');
  eq(matchKind(undefined), 'other');
  eq(matchKind(0), 'other');
});

test('NaN matches no case at all — not even case NaN', () => {
  eq(matchKind(NaN), 'other');
  eq(matchKind(2), 'other');
});
