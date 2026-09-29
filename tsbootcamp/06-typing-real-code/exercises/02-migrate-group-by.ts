// ─────────────────────────────────────────────────────────────────────────
//  02 · groupBy & countBy — migrate them                   ★★☆ core
//  concepts: two type parameters · PropertyKey · Record<K, V>
//  run: node ../run.js exercises/02-migrate-group-by.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Second migration, same deal: the bodies already work, the runtime
//  tests are green from the start, and tsc is the todo list.
//
//  The JS you were handed:
//
//      function groupBy(items, keyOf) { /* the body below, verbatim */ }
//      function countBy(items, keyOf) { /* likewise */ }
//
//      groupBy(people, p => p.role)     → { admin: [...], member: [...] }
//      groupBy(['a','bb','cc'], s => s.length) → { 1: [...], 2: [...] }
//      countBy(people, p => p.role)     → { admin: 1, member: 2 }
//
//  Two type parameters: the element type, and the key type. The key one
//  needs a constraint — not every value can be an object key.
//
//  hint: `PropertyKey` is the built-in `string | number | symbol`; the
//  empty accumulator is the one place an `as` is honest, because `{}` is
//  genuinely not a full Record yet

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function groupBy(items: TODO, keyOf: TODO): TODO {
  const out = {} as TODO;
  for (const item of items) {
    const key = keyOf(item);
    if (!Object.hasOwn(out, key)) out[key] = [];
    out[key].push(item);
  }
  return out;
}

export function countBy(items: TODO, keyOf: TODO): TODO {
  const out = {} as TODO;
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
