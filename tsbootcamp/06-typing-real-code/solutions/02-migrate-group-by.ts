// ─────────────────────────────────────────────────────────────────────────
//  02 · groupBy & countBy — migrate them — SOLUTION        ★★☆ core
//  run: node ../run.js solutions/02-migrate-group-by.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two type parameters, because two independent things vary.
//  `T` is the element type and is inferred from `items`; `K` is whatever
//  the callback returns and must be constrained to `PropertyKey`, or you
//  could group by an object and index with `[object Object]`.
//
//  Writing `items: readonly T[]` instead of `T[]` costs nothing and lets
//  callers pass an `as const` array or a readonly field. Take the widest
//  input your body can honestly handle.
//
//  `const out = {} as Record<K, T[]>` is the one honest assertion here:
//  the object really is empty at that moment, and the loop is what makes
//  the claim true. The alternative — `Partial<Record<K, T[]>>` — is more
//  truthful (a group can be missing) but forces `?? []` on every read.
//  Libraries pick the lie; `Object.groupBy` in the standard library picks
//  the truth and returns `Partial<Record<K, T[]>>`. Know which you chose.
//
//  Classic wrong turn: `keyOf: (item: T) => string`. It compiles, but the
//  result is `Record<string, T[]>` and you lose the "these are the only
//  groups" knowledge that makes `byRole.admin` safe.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyOf(item);
    if (!Object.hasOwn(out, key)) out[key] = [];
    out[key].push(item);
  }
  return out;
}

export function countBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const item of items) {
    const key = keyOf(item);
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

// fixture data for the tests below
export interface Person {
  name: string;
  role: 'admin' | 'member';
  age: number;
}

const people: Person[] = [
  { name: 'ada', role: 'admin', age: 36 },
  { name: 'bo', role: 'member', age: 24 },
  { name: 'cy', role: 'member', age: 36 },
];

// ─────────────────────────── runtime tests ───────────────────────────────

test('groups by a string key', () => {
  eq(groupBy(people, (p: Person) => p.role), {
    admin: [people[0]],
    member: [people[1], people[2]],
  });
});

test('groups by a computed number key', () => {
  eq(groupBy(['a', 'bb', 'cc'], (s: string) => s.length), {
    1: ['a'],
    2: ['bb', 'cc'],
  });
});

test('keeps the input order inside each group', () => {
  const byAge = groupBy(people, (p: Person) => p.age);
  eq(byAge[36].map((p: Person) => p.name), ['ada', 'cy']);
});

test('an empty list groups into an empty object', () => {
  eq(groupBy([], (n: number) => n), {});
});

test('countBy counts instead of collecting', () => {
  eq(countBy(people, (p: Person) => p.role), { admin: 1, member: 2 });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _g1 = Expect<
  Equal<ReturnType<typeof groupBy<string, 'a' | 'b'>>, Record<'a' | 'b', string[]>>
>;
type _g2 = Expect<
  Equal<ReturnType<typeof countBy<Person, string>>, Record<string, number>>
>;

function _typeTests() {
  const byRole = groupBy(people, (p) => p.role);
  const admins: Person[] = byRole.admin;
  use(admins);

  // @ts-expect-error — 'ghost' is not a key the callback can produce
  byRole.ghost;

  // @ts-expect-error — an object is not usable as a key
  groupBy(people, (p) => ({ role: p.role }));

  // @ts-expect-error — the callback is handed a Person, not a string
  groupBy(people, (p: string) => p);

  const counts = countBy(people, (p) => p.age);
  const n: number = counts[36];
  use(n);
}
use(_typeTests);
