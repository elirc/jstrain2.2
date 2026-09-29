// ─────────────────────────────────────────────────────────────────────────
//  44 · object diff — SOLUTION                             ★★★ stretch
//  run: node 44-object-diff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a diff is two key-set walks. Everything in `after` is
//  either new (not in `before`) or possibly changed; everything in `before`
//  that `after` does not have is removed. Two traps live in that sentence.
//  First, membership must be `Object.hasOwn`, not a truthiness or
//  `!== undefined` check, or a key explicitly set to `undefined` reads as
//  missing — which is exactly the case a "clear this field" patch produces.
//  Second, equality must be structural: `before.tags !== after.tags` is
//  true for every object that came back from a fresh `JSON.parse`, so an
//  identity check reports the entire payload as changed on every poll.
//  `changed[key] = [old, new]` as a pair keeps the old value for undo and
//  for the audit line, which is usually why you were asked for a diff.

import { isDeepStrictEqual } from 'node:util';
import { test, eq, ok } from '../../_lib/check.js';

const isSame = (a, b) => isDeepStrictEqual(a, b);

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const BEFORE = deepFreeze({
  id: 'in-9',
  status: 'draft',
  amount: 120,
  currency: 'EUR',
  tags: ['q1'],
});

const AFTER = deepFreeze({
  id: 'in-9',
  status: 'sent',
  amount: 120,
  tags: ['q1'],
  dueDays: 30,
});

export function diff(before, after) {
  const added = {};
  const removed = {};
  const changed = {};

  for (const key of Object.keys(after)) {
    if (!Object.hasOwn(before, key)) added[key] = after[key];
    else if (!isSame(before[key], after[key])) {
      changed[key] = [before[key], after[key]];
    }
  }

  for (const key of Object.keys(before)) {
    if (!Object.hasOwn(after, key)) removed[key] = before[key];
  }

  return { added, removed, changed };
}

export function hasChanges(before, after) {
  const { added, removed, changed } = diff(before, after);
  return (
    Object.keys(added).length + Object.keys(removed).length + Object.keys(changed).length > 0
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a key only in after is an addition', () => {
  eq(diff(BEFORE, AFTER).added, { dueDays: 30 });
});

test('a key only in before is a removal', () => {
  eq(diff(BEFORE, AFTER).removed, { currency: 'EUR' });
});

test('a changed key reports the old value and the new one', () => {
  eq(diff(BEFORE, AFTER).changed, { status: ['draft', 'sent'] });
  eq(hasChanges(BEFORE, AFTER), true);
});

test('keys that did not move are silent', () => {
  const d = diff(BEFORE, AFTER);
  ok(!('id' in d.changed));
  ok(!('amount' in d.changed));
});

test('equal contents are not a change, whatever the identity', () => {
  ok(BEFORE.tags !== AFTER.tags);
  ok(!('tags' in diff(BEFORE, AFTER).changed));
});

test('nothing differs between an object and itself', () => {
  eq(diff(BEFORE, BEFORE), { added: {}, removed: {}, changed: {} });
  eq(hasChanges(BEFORE, BEFORE), false);
});

test('an undefined value is a present key, not an absent one', () => {
  const d = diff({ note: undefined }, {});
  eq(Object.keys(d.removed), ['note']);
  eq(d.added, {});
});

test('NaN does not count as a change', () => {
  eq(diff({ x: NaN }, { x: NaN }).changed, {});
  eq(hasChanges({ x: NaN }, { x: NaN }), false);
});
