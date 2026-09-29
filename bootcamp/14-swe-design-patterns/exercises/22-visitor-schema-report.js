// ─────────────────────────────────────────────────────────────────────────
//  22 · schema visitor                                        ★★★ stretch
//  concepts: visitor · double dispatch · tree walk
//  run: node exercises/22-visitor-schema-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You have a JSON-schema-ish tree and five different jobs to do with it:
//  document it, validate it, generate types, count fields, diff it. Each
//  job wants to visit every node and do something per node TYPE. Writing
//  the recursion five times is how trees rot.
//
//  Write the walk once. Callers bring a table of per-type handlers:
//
//      walk(schema, {
//        object: (node, ctx) => ...,     ctx = { path: '$.profile',
//        string: (node, ctx) => ...,                depth: 1 }
//        default: (node, ctx) => ...,    // anything unlisted
//      });
//
//  Pre-order: visit a node, then its children. Paths read like JSONPath —
//  `$`, `$.id`, `$.profile.name`, `$.tags[]`. An unlisted type with no
//  `default` is a bug, not a silent skip: throw
//  `no visitor for type: date`.
//
//  Then build one report on top of it:
//
//      schemaReport(USER_SCHEMA)
//        → { nodes: 8, byType: { object: 2, string: 3, ... },
//            required: ['$.id', ...], maxDepth: 2 }
//
//  hint: only `walk` knows that objects have `fields` and arrays have
//  `items` — a new LEAF type must cost a new handler and nothing else

import { test, eq, spy, throws } from '../../_lib/check.js';

export function walk(node, visitors, ctx = { path: '$', depth: 0 }) {
  throw new Error('TODO');
}

export function schemaReport(root) {
  // -> { nodes, byType, required, maxDepth }
  throw new Error('TODO');
}

const USER_SCHEMA = {
  type: 'object',
  fields: {
    id: { type: 'string', required: true },
    profile: {
      type: 'object',
      fields: {
        name: { type: 'string', required: true },
        age: { type: 'number' },
      },
    },
    tags: { type: 'array', items: { type: 'string' } },
    active: { type: 'boolean', required: true },
  },
};

const EVENT_SCHEMA = {
  type: 'object',
  fields: {
    at: { type: 'date', required: true },
    name: { type: 'string' },
  },
};

const noop = () => {};

// ──────────────────────────── tests ──────────────────────────────────────

test('each node goes to the handler for its own type', () => {
  const visitors = {
    object: spy(),
    string: spy(),
    number: spy(),
    array: spy(),
    boolean: spy(),
  };
  walk(USER_SCHEMA, visitors);
  eq(visitors.object.callCount, 2);
  eq(visitors.string.callCount, 3);
  eq(visitors.number.callCount, 1);
  eq(visitors.array.callCount, 1);
  eq(visitors.boolean.callCount, 1);
});

test('the walk is pre-order and hands out JSONPath-ish paths', () => {
  const paths = [];
  walk(USER_SCHEMA, { default: (node, ctx) => paths.push(ctx.path) });
  eq(paths, [
    '$',
    '$.id',
    '$.profile',
    '$.profile.name',
    '$.profile.age',
    '$.tags',
    '$.tags[]',
    '$.active',
  ]);
});

test('depth counts how far down the node sits', () => {
  const seen = [];
  walk(USER_SCHEMA, { default: (node, ctx) => seen.push([ctx.path, ctx.depth]) });
  eq(seen[0], ['$', 0]);
  eq(seen[3], ['$.profile.name', 2]);
  eq(seen[6], ['$.tags[]', 2]);
});

test('an unlisted type falls through to default', () => {
  const fallback = spy();
  walk(EVENT_SCHEMA, { object: noop, string: noop, default: fallback });
  eq(fallback.callCount, 1);
  eq(fallback.calls[0][0].type, 'date');
  eq(fallback.calls[0][1].path, '$.at');
});

test('an unlisted type with no default is a loud bug', () => {
  const visitors = { object: noop, string: noop };
  throws(() => walk(EVENT_SCHEMA, visitors), 'no visitor for type: date');
});

test('a new node type costs a handler, not a change to walk', () => {
  const dates = spy();
  walk(EVENT_SCHEMA, { object: noop, string: noop, date: dates });
  eq(dates.callCount, 1);
  eq(dates.calls[0][1].path, '$.at');
});

test('the report counts every node by type', () => {
  const report = schemaReport(USER_SCHEMA);
  eq(report.nodes, 8);
  eq(report.byType, {
    object: 2,
    string: 3,
    number: 1,
    array: 1,
    boolean: 1,
  });
});

test('the report lists required paths in document order and the depth', () => {
  const report = schemaReport(USER_SCHEMA);
  eq(report.required, ['$.id', '$.profile.name', '$.active']);
  eq(report.maxDepth, 2);
  eq(schemaReport(EVENT_SCHEMA).required, ['$.at']);
});
