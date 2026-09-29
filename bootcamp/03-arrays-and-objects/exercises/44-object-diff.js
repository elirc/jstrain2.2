// ─────────────────────────────────────────────────────────────────────────
//  44 · object diff                                        ★★★ stretch
//  concepts: key sets · deep equality · identity is not equality
//  run: node 44-object-diff.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Audit logs, optimistic-update rollbacks and "unsaved changes?" prompts
//  all need the same answer: what actually differs between these two
//  records? Not "are they different objects" — WHICH keys, and how.
//
//      diff(BEFORE, AFTER)
//        → {
//            added:   { dueDays: 30 },
//            removed: { currency: 'EUR' },
//            changed: { status: ['draft', 'sent'] },
//          }
//      hasChanges(BEFORE, BEFORE)   → false
//
//  Compare VALUES, not references: two arrays with the same contents are
//  not a change, however different their identities. `isSame` below does
//  that for you.
//
//  hint: walk the keys of `after` for added/changed, then the keys of
//  `before` for removed. `Object.hasOwn(obj, key)` is the membership test —
//  `obj[key] !== undefined` gets the `undefined`-valued keys wrong.

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
  throw new Error('TODO');
}

export function hasChanges(before, after) {
  throw new Error('TODO');
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
