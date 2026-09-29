// ─────────────────────────────────────────────────────────────────────────
//  03 · mixed set C                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 03-mixed-set-c.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs at a climbing gym. No hints. One sitting.
//
//    makeRouteLabelers(ROUTES)[2]()  → 'Arete Dance (V2)'
//      one function per route, each reporting its OWN route
//    groupByGrade(ROUTES)            → { V2: [r1, r3], V5: [r2, r4], … }
//    promoteMember(GYM, 'm1', 'pro') → a new gym; GYM is deep-frozen and
//                                      must stay exactly as it was
//    dedupeByTag(entries)            → the FIRST entry for each tag,
//                                      in the order they arrived
//    toKebab('roofRodeo')            → 'roof-rodeo'
//    toKebab('Slab  Waltz!')         → 'slab-waltz'

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const ROUTES = deepFreeze([
  { id: 'r1', name: 'Slab Waltz', grade: 'V2', area: 'slab' },
  { id: 'r2', name: 'Cave Crimps', grade: 'V5', area: 'cave' },
  { id: 'r3', name: 'Arete Dance', grade: 'V2', area: 'arete' },
  { id: 'r4', name: 'Roof Rodeo', grade: 'V5', area: 'cave' },
  { id: 'r5', name: 'Warm Up Jugs', grade: 'V0', area: 'slab' },
]);

const GYM = deepFreeze({
  name: 'Northwall',
  members: {
    m1: { name: 'Ada', plan: { tier: 'basic', months: 3 } },
    m2: { name: 'Bo', plan: { tier: 'pro', months: 12 } },
  },
});

export function makeRouteLabelers(routes) {
  throw new Error('TODO');
}

export function groupByGrade(routes) {
  throw new Error('TODO');
}

export function promoteMember(gym, memberId, tier) {
  throw new Error('TODO');
}

export function dedupeByTag(entries) {
  throw new Error('TODO');
}

export function toKebab(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('each labeler describes its own route, not the last one', () => {
  const labelers = makeRouteLabelers(ROUTES);
  eq(labelers.length, 5);
  eq(labelers[0](), 'Slab Waltz (V2)');
  eq(labelers[2](), 'Arete Dance (V2)');
  eq(labelers[4](), 'Warm Up Jugs (V0)');
});

test('routes bucket by grade, in source order', () => {
  const groups = groupByGrade(ROUTES);
  eq(Object.keys(groups), ['V2', 'V5', 'V0']);
  eq(groups.V2.map((r) => r.id), ['r1', 'r3']);
  eq(groups.V5.map((r) => r.id), ['r2', 'r4']);
});

test('a promotion returns a new gym carrying the new tier', () => {
  const after = promoteMember(GYM, 'm1', 'pro');
  eq(after.members.m1.plan.tier, 'pro');
  eq(after.members.m1.plan.months, 3);
  eq(after.name, 'Northwall');
});

test('the frozen original is untouched', () => {
  promoteMember(GYM, 'm1', 'pro');
  eq(GYM.members.m1.plan.tier, 'basic');
});

test('branches that did not change are shared, not copied', () => {
  const after = promoteMember(GYM, 'm1', 'pro');
  ok(after !== GYM, 'the gym itself is a new object');
  ok(after.members !== GYM.members, 'the changed path is cloned');
  ok(after.members.m2 === GYM.members.m2, 'untouched members are shared');
});

test('the first entry wins for each tag', () => {
  eq(
    dedupeByTag([
      { tag: 'beta', note: 'heel hook' },
      { tag: 'warn', note: 'loose hold' },
      { tag: 'beta', note: 'toe hook' },
      { tag: 'warn', note: 'chalk up' },
    ]),
    [
      { tag: 'beta', note: 'heel hook' },
      { tag: 'warn', note: 'loose hold' },
    ]
  );
  eq(dedupeByTag([]), []);
});

test('kebab-case survives spaces, camelCase and punctuation', () => {
  eq(toKebab('Slab Waltz'), 'slab-waltz');
  eq(toKebab('roofRodeo'), 'roof-rodeo');
  eq(toKebab('Slab  Waltz!'), 'slab-waltz');
  eq(toKebab('V5 Roof'), 'v5-roof');
});
