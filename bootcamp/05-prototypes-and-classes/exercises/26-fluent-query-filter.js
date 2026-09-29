// ─────────────────────────────────────────────────────────────────────────
//  26 · fluent query filter                                ★★☆ core
//  concepts: fluent interfaces · immutable builders · chaining
//  run: node 26-fluent-query-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A builder reads like a sentence because every step hands back an object
//  to keep talking to. Return `this` and the chain is fast but shared;
//  return a NEW filter each time and a half-built query can be branched
//  and reused. Build the second kind.
//
//      const admins = new QueryFilter().where('role', 'admin');
//      admins.sortBy('name').limit(2).run(rows) → the first two, by name
//      admins.run(rows)                         → still every admin
//
//      new QueryFilter().describe()             → 'all rows'
//      admins.greaterThan('age', 30).describe()
//        → 'role = admin | age > 30'
//
//  Steps run in the order you chained them, so .sortBy().limit() and
//  .limit().sortBy() are different queries. run() must not disturb the
//  array it is handed — sort() mutates, and the caller did not ask for
//  that.
//
//  hint: keep a list of step descriptions and have every method return
//  `new QueryFilter([...this.steps, step])` — run() is then one loop

import { test, eq, ok } from '../../_lib/check.js';

// ── scaffolding: the rows every test queries ─────────────────────────────

const rows = [
  { name: 'ada', role: 'admin', age: 36 },
  { name: 'cy', role: 'admin', age: 24 },
  { name: 'bob', role: 'guest', age: 51 },
  { name: 'dot', role: 'admin', age: 44 },
];

export class QueryFilter {
  #steps;

  constructor(steps = []) {
    throw new Error('TODO');
  }

  #with(step) {
    throw new Error('TODO');
  }

  where(field, value) {
    throw new Error('TODO');
  }

  greaterThan(field, min) {
    throw new Error('TODO');
  }

  sortBy(field) {
    throw new Error('TODO');
  }

  limit(count) {
    throw new Error('TODO');
  }

  run(source) {
    throw new Error('TODO');
  }

  describe() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an empty filter returns every row', () => {
  const out = new QueryFilter().run(rows);
  eq(out.map((r) => r.name), ['ada', 'cy', 'bob', 'dot']);
  ok(out !== rows, 'a fresh array, not the one it was handed');
});

test('where and greaterThan stack up', () => {
  const q = new QueryFilter().where('role', 'admin').greaterThan('age', 30);
  eq(q.run(rows).map((r) => r.name), ['ada', 'dot']);
});

test('steps run in the order you chained them', () => {
  const sortThenLimit = new QueryFilter().sortBy('age').limit(1);
  const limitThenSort = new QueryFilter().limit(1).sortBy('age');
  eq(sortThenLimit.run(rows).map((r) => r.name), ['cy'], 'youngest of all');
  eq(limitThenSort.run(rows).map((r) => r.name), ['ada'], 'youngest of one');
});

test('every step returns a NEW filter, so a base query can branch', () => {
  const admins = new QueryFilter().where('role', 'admin');
  const young = admins.greaterThan('age', 40);
  ok(young !== admins);
  eq(young.run(rows).map((r) => r.name), ['dot']);
  eq(admins.run(rows).map((r) => r.name), ['ada', 'cy', 'dot'], 'untouched');
});

test('run never disturbs the rows it was handed', () => {
  const before = rows.map((r) => r.name);
  new QueryFilter().sortBy('name').run(rows);
  eq(rows.map((r) => r.name), before, 'sort() mutates — copy first');
});

test('sortBy orders strings and numbers', () => {
  eq(new QueryFilter().sortBy('name').run(rows).map((r) => r.name), [
    'ada',
    'bob',
    'cy',
    'dot',
  ]);
  eq(new QueryFilter().sortBy('age').run(rows).map((r) => r.age), [
    24, 36, 44, 51,
  ]);
});

test('describe reads the chain back', () => {
  eq(new QueryFilter().describe(), 'all rows');
  const q = new QueryFilter()
    .where('role', 'admin')
    .greaterThan('age', 30)
    .sortBy('name')
    .limit(2);
  eq(q.describe(), 'role = admin | age > 30 | sort by name | limit 2');
});

test('one filter can be run against different data', () => {
  const q = new QueryFilter().where('role', 'admin').sortBy('name');
  eq(q.run(rows).map((r) => r.name), ['ada', 'cy', 'dot']);
  eq(q.run([{ name: 'zed', role: 'admin', age: 20 }]).length, 1);
  eq(q.run([]).length, 0);
});
