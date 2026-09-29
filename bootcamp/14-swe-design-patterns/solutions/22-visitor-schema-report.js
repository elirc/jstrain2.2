// ─────────────────────────────────────────────────────────────────────────
//  22 · schema visitor — SOLUTION                              ★★★ stretch
//  concepts: visitor · double dispatch · tree walk
//  run: node solutions/22-visitor-schema-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — separate "how to walk a structure" from "what to do at each
//  node", so a new operation over the tree is a new table of functions
//  instead of a new recursion.
//  In the textbook the node objects carry an `accept(visitor)` method
//  and dispatch on their own class. In JS the node types are strings, so
//  visitor collapses into a lookup table plus a recursive walk — the
//  same double dispatch (which node × which operation) with none of the
//  ceremony. That is why it is "visitor-lite".
//  The seam to protect: `walk` is the ONLY place that knows objects have
//  `fields` and arrays have `items`. Handlers know nothing about
//  recursion. Add a `uuid` leaf type and you add one handler; add a new
//  report and you touch no traversal code at all.
//  `Object.hasOwn` rather than `visitors[type] ??` because a type called
//  `constructor` or `toString` would otherwise inherit a function from
//  Object.prototype and get "handled" by garbage.
//  Throwing on an unknown type is deliberate. Silent skips are how a
//  schema grows a field that the doc generator never mentions.
//  When NOT to use: a shallow, stable shape you touch once — a plain
//  recursive function is shorter and reads better. Visitor also fights
//  you when the operation needs to RETURN something structural; then a
//  fold/transform (see 32's projection) is the better tool.
//  In the wild: Babel and ESLint visitors keyed by AST node type,
//  PostCSS walkers, `ts.forEachChild`, GraphQL's `visit()`.

import { test, eq, spy, throws } from '../../_lib/check.js';

export function walk(node, visitors, ctx = { path: '$', depth: 0 }) {
  const visit = Object.hasOwn(visitors, node.type)
    ? visitors[node.type]
    : visitors.default;
  if (!visit) throw new Error(`no visitor for type: ${node.type}`);

  visit(node, ctx);

  if (node.type === 'object') {
    for (const [name, child] of Object.entries(node.fields)) {
      walk(child, visitors, {
        path: `${ctx.path}.${name}`,
        depth: ctx.depth + 1,
      });
    }
  }
  if (node.type === 'array') {
    walk(node.items, visitors, {
      path: `${ctx.path}[]`,
      depth: ctx.depth + 1,
    });
  }
}

export function schemaReport(root) {
  const report = { nodes: 0, byType: {}, required: [], maxDepth: 0 };

  const record = (node, ctx) => {
    report.nodes += 1;
    report.byType[node.type] = (report.byType[node.type] ?? 0) + 1;
    if (node.required) report.required.push(ctx.path);
    report.maxDepth = Math.max(report.maxDepth, ctx.depth);
  };

  walk(root, { default: record });
  return report;
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
