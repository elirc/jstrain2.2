// ─────────────────────────────────────────────────────────────────────────
//  14 · QueryBuilder — SOLUTION                              ★★★ stretch
//  concepts: builder · fluent API · immutable chaining
//  run: node solutions/14-builder-query.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — assemble a complicated object step by step, so the caller
//  names only the parts it cares about and the defaults live in one
//  place.
//  Two decisions carry this design. First, each step returns a *new*
//  builder: a mutating builder makes `const base = q.where(...)` a trap,
//  because every branch off `base` would silently share its clauses.
//  Second, validation happens at the step that caused it — `where('~')`
//  throws on the `where` line, not later inside `build()`, which is the
//  difference between a one-second fix and a debugging session.
//  `build()` also deep-copies, so a returned descriptor cannot be edited
//  back into the builder.
//  When NOT to use: an object with three optional fields does not need a
//  builder — `createQuery({ table, limit })` is shorter and greppable.
//  In the wild: Knex, Prisma's fluent client, `supertest`'s
//  `request(app).get().expect()`, D3 selections, superagent.

import { test, eq, ok, throws } from '../../_lib/check.js';

const OPS = new Set(['=', '!=', '>', '<', 'in']);

export function createQuery(table) {
  const build = (state) => ({
    select: (...fields) =>
      build({ ...state, fields: fields.length ? fields : ['*'] }),

    where(field, op, value) {
      if (!OPS.has(op)) throw new Error(`unsupported operator: ${op}`);
      return build({ ...state, where: [...state.where, { field, op, value }] });
    },

    orderBy: (field, dir = 'asc') =>
      build({ ...state, orderBy: [...state.orderBy, { field, dir }] }),

    limit(n) {
      if (!Number.isInteger(n) || n < 0) {
        throw new Error('limit must be a non-negative integer');
      }
      return build({ ...state, limit: n });
    },

    build: () => ({
      table,
      fields: [...state.fields],
      where: state.where.map((clause) => ({ ...clause })),
      orderBy: state.orderBy.map((clause) => ({ ...clause })),
      limit: state.limit,
    }),
  });

  return build({ fields: ['*'], where: [], orderBy: [], limit: null });
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
