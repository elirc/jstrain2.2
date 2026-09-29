// ─────────────────────────────────────────────────────────────────────────
//  42 · switch fallthrough — SOLUTION                       ★☆☆ warm-up
//  run: node 42-switch-fallthrough.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `switch` matches with ===, then runs from the matching
//  label to the next `break`/`return` — not to the next `case`. Grouped
//  labels (permissionFor) exploit that with empty bodies and read as a
//  set membership test.
//
//  featuresFor is the deliberate version: 'pro' pushes 'sso' and then
//  keeps falling, collecting everything a cheaper plan gets. Written with
//  breaks it would need the lower plans' features repeated in each case,
//  which is exactly the list that drifts out of sync. The `// fallthrough`
//  comments are not decoration — they are the difference between "on
//  purpose" and "forgot a break", for both the reviewer and the linter.
//
//  `case NaN` is unreachable dead code by construction, because === says
//  NaN matches nothing, itself included. If you need it, use an if/else
//  ladder with Number.isNaN, or a Map keyed by value.

import { test, eq } from '../../_lib/check.js';

export function permissionFor(method) {
  switch (method) {
    case 'GET':
    case 'HEAD':
    case 'OPTIONS':
      return 'read';
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return 'write';
    default:
      return 'unknown';
  }
}

export function featuresFor(plan) {
  const features = [];
  switch (plan) {
    case 'pro':
      features.push('sso');
    // fallthrough
    case 'plus':
      features.push('reports');
    // fallthrough
    case 'free':
      features.push('basic');
      break;
    default:
      return [];
  }
  return features;
}

export function matchKind(value) {
  switch (value) {
    case 1:
      return 'number one';
    case '1':
      return 'string one';
    case true:
      return 'boolean';
    case null:
      return 'null';
    case NaN:
      return 'never happens'; // unreachable: NaN === NaN is false
    default:
      return 'other';
  }
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
