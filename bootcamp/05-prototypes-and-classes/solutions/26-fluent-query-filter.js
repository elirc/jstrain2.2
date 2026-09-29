// ─────────────────────────────────────────────────────────────────────────
//  26 · fluent query filter — SOLUTION                     ★★☆ core
//  run: node 26-fluent-query-filter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the builder stores DESCRIPTIONS of the work, not the work
//  itself. Each method appends one step object and hands back a new
//  QueryFilter wrapped around the longer list — which is why `admins` is
//  still just the role filter after `admins.greaterThan(...)` ran. That is
//  the whole difference between an immutable builder and the `return this`
//  kind, where every branch would quietly edit the shared query.
//
//  run() is one loop over the steps, and it opens with `[...source]` so
//  the sort() below it churns a copy — sort mutates in place, and a query
//  that reorders the caller's array is a bug you find much later.
//
//  Comparisons use plain < and >, not localeCompare: the same input must
//  sort the same way on every machine.

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
    this.#steps = [...steps];
  }

  #with(step) {
    return new QueryFilter([...this.#steps, step]);
  }

  where(field, value) {
    return this.#with({ kind: 'where', field, value });
  }

  greaterThan(field, min) {
    return this.#with({ kind: 'gt', field, min });
  }

  sortBy(field) {
    return this.#with({ kind: 'sort', field });
  }

  limit(count) {
    return this.#with({ kind: 'limit', count });
  }

  run(source) {
    let out = [...source];
    for (const step of this.#steps) {
      if (step.kind === 'where') {
        out = out.filter((row) => row[step.field] === step.value);
      } else if (step.kind === 'gt') {
        out = out.filter((row) => row[step.field] > step.min);
      } else if (step.kind === 'sort') {
        out = out.sort((a, b) => {
          if (a[step.field] < b[step.field]) return -1;
          return a[step.field] > b[step.field] ? 1 : 0;
        });
      } else if (step.kind === 'limit') {
        out = out.slice(0, step.count);
      }
    }
    return out;
  }

  describe() {
    if (this.#steps.length === 0) return 'all rows';
    return this.#steps
      .map((step) => {
        if (step.kind === 'where') return `${step.field} = ${step.value}`;
        if (step.kind === 'gt') return `${step.field} > ${step.min}`;
        if (step.kind === 'sort') return `sort by ${step.field}`;
        return `limit ${step.count}`;
      })
      .join(' | ');
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
