// ─────────────────────────────────────────────────────────────────────────
//  14 · QueryBuilder                                         ★★★ stretch
//  concepts: builder · fluent API · immutable chaining
//  run: node exercises/14-builder-query.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Building a query object by hand means a seven-key literal at every
//  call site, half of them missing a default. Give it a fluent builder
//  that ends in a plain descriptor object.
//
//      createQuery('users')
//        .select('id', 'name')
//        .where('age', '>', 18)
//        .orderBy('name')
//        .limit(10)
//        .build()
//      →  { table: 'users',
//           fields: ['id', 'name'],
//           where: [{ field: 'age', op: '>', value: 18 }],
//           orderBy: [{ field: 'name', dir: 'asc' }],
//           limit: 10 }
//
//      createQuery('users').build()
//      →  { table: 'users', fields: ['*'], where: [], orderBy: [],
//           limit: null }
//
//  Rules:
//    · where and orderBy accumulate, in call order; orderBy dir
//      defaults to 'asc'
//    · every step returns a NEW builder — the one you called it on is
//      unchanged, so a half-built query is safe to share and branch
//    · ops are '=', '!=', '>', '<', 'in'; anything else throws
//      'unsupported operator: <op>'
//    · limit takes a non-negative integer, else throws
//      'limit must be a non-negative integer'
//
//  hint: keep the state in a plain object and have each method return a
//  fresh builder built from `{ ...state, ...patch }`

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createQuery(table) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a bare query selects everything', () => {
  eq(createQuery('users').build(), {
    table: 'users',
    fields: ['*'],
    where: [],
    orderBy: [],
    limit: null,
  });
});

test('select and limit land in the descriptor', () => {
  const q = createQuery('users').select('id', 'name').limit(10).build();
  eq(q.fields, ['id', 'name']);
  eq(q.limit, 10);
  eq(createQuery('users').limit(0).build().limit, 0);
});

test('where clauses accumulate in call order', () => {
  const q = createQuery('users')
    .where('age', '>', 18)
    .where('city', '=', 'Lagos')
    .build();
  eq(q.where, [
    { field: 'age', op: '>', value: 18 },
    { field: 'city', op: '=', value: 'Lagos' },
  ]);
});

test('orderBy accumulates and defaults to ascending', () => {
  const q = createQuery('users').orderBy('name').orderBy('age', 'desc').build();
  eq(q.orderBy, [
    { field: 'name', dir: 'asc' },
    { field: 'age', dir: 'desc' },
  ]);
});

test('each step returns a new builder, leaving the old one alone', () => {
  const base = createQuery('users').where('active', '=', true);
  const narrowed = base.where('age', '>', 18);
  ok(base !== narrowed, 'the builder mutated itself');
  eq(base.build().where.length, 1);
  eq(narrowed.build().where.length, 2);
});

test('two branches off one base never contaminate each other', () => {
  const base = createQuery('orders').where('status', '=', 'paid');
  const recent = base.orderBy('createdAt', 'desc').limit(5);
  const big = base.where('total', '>', 1000);
  eq(recent.build().where.length, 1);
  eq(recent.build().limit, 5);
  eq(big.build().where.length, 2);
  eq(big.build().limit, null);
});

test('build hands out a fresh descriptor every time', () => {
  const q = createQuery('users').where('age', '>', 18);
  const first = q.build();
  first.where.push({ field: 'hacked', op: '=', value: true });
  first.fields.push('secret');
  eq(q.build().where.length, 1);
  eq(q.build().fields, ['*']);
});

test('nonsense is rejected at the call that caused it', () => {
  createQuery('users');
  throws(() => createQuery('users').where('age', '~', 18), 'unsupported operator: ~');
  throws(() => createQuery('users').limit(-1), 'non-negative integer');
  throws(() => createQuery('users').limit(1.5), 'non-negative integer');
});
