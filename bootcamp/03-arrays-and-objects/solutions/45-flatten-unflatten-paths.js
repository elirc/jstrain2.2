// ─────────────────────────────────────────────────────────────────────────
//  45 · flatten and unflatten dotted paths — SOLUTION      ★★★ stretch
//  run: node 45-flatten-unflatten-paths.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: flattening is a depth-first walk carrying the path so far;
//  `Object.entries` treats an array as `[['0', item], …]`, which is why
//  arrays need no special case on the way down. The two leaf rules are the
//  whole trick: `typeof null === 'object'` would send you recursing into
//  nothing, and an empty container has no entries to emit, so without the
//  `length > 0` guard `labels: {}` would silently disappear from the round
//  trip. Coming back up, you cannot know from `rows.0.id` alone whether
//  `rows` is an array — you decide by looking at the NEXT segment, and a
//  digits-only segment means array. That heuristic is also the format's one
//  real flaw: an object whose keys are "0" and "1" comes back as an array,
//  and a key containing a literal dot cannot survive at all.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const CONFIG = deepFreeze({
  station: { code: 'KX1', altitude: 340 },
  sensors: [
    { type: 'temp', unit: 'C' },
    { type: 'rain', unit: 'mm' },
  ],
  active: true,
  note: null,
  labels: {},
});

const isBranch = (value) =>
  value !== null && typeof value === 'object' && Object.keys(value).length > 0;

export function flattenPaths(value, prefix = '') {
  const flat = {};
  for (const [key, child] of Object.entries(value)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (isBranch(child)) Object.assign(flat, flattenPaths(child, path));
    else flat[path] = child;
  }
  return flat;
}

export function unflattenPaths(flat) {
  const root = {};
  for (const [path, value] of Object.entries(flat)) {
    const segments = path.split('.');
    let node = root;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const nextIsIndex = /^\d+$/.test(segments[i + 1]);
      node[segments[i]] ??= nextIsIndex ? [] : {};
      node = node[segments[i]];
    }
    node[segments.at(-1)] = value;
  }
  return root;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('nested objects become dotted keys', () => {
  const flat = flattenPaths(CONFIG);
  eq(flat['station.code'], 'KX1');
  eq(flat['station.altitude'], 340);
  ok(!('station' in flat));
});

test('array indexes become numeric segments', () => {
  const flat = flattenPaths(CONFIG);
  eq(flat['sensors.0.type'], 'temp');
  eq(flat['sensors.1.unit'], 'mm');
});

test('null is a leaf, not a container', () => {
  eq(flattenPaths(CONFIG).note, null);
});

test('an empty object survives as a leaf', () => {
  eq(flattenPaths(CONFIG).labels, {});
});

test('every key of the flat form is a full path', () => {
  eq(Object.keys(flattenPaths(CONFIG)).sort(), [
    'active',
    'labels',
    'note',
    'sensors.0.type',
    'sensors.0.unit',
    'sensors.1.type',
    'sensors.1.unit',
    'station.altitude',
    'station.code',
  ]);
});

test('unflatten rebuilds nested objects', () => {
  eq(unflattenPaths({ 'a.b.c': 1, 'a.d': 2 }), { a: { b: { c: 1 }, d: 2 } });
});

test('a numeric segment rebuilds a real array', () => {
  const tree = unflattenPaths({ 'rows.0.id': 'x', 'rows.1.id': 'y' });
  ok(Array.isArray(tree.rows));
  eq(tree.rows, [{ id: 'x' }, { id: 'y' }]);
});

test('the round trip is lossless and the input is untouched', () => {
  eq(unflattenPaths(flattenPaths(CONFIG)), CONFIG);
  eq(CONFIG.sensors.length, 2);
  eq(flattenPaths({}), {});
});
