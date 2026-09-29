// ─────────────────────────────────────────────────────────────────────────
//  45 · flatten and unflatten dotted paths                 ★★★ stretch
//  concepts: recursion · path segments · rebuilding arrays
//  run: node 45-flatten-unflatten-paths.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Env files, i18n catalogues, form libraries and feature-flag services all
//  speak in flat dotted keys, while your app wants a tree. Write both
//  directions and the conversion stops being scary.
//
//      flattenPaths(CONFIG)
//        → { 'station.code': 'KX1', 'sensors.0.type': 'temp', … }
//      unflattenPaths({ 'sensors.0.type': 'temp' })
//        → { sensors: [ { type: 'temp' } ] }
//
//  Two rules do the work. A leaf is anything that is not an object, plus
//  any EMPTY object or array — otherwise `{}` would vanish. On the way
//  back, a segment made of digits means the parent is an array.
//
//  hint: build the path with a prefix argument as you recurse. Coming back
//  up, look at the NEXT segment to decide whether to create `[]` or `{}`.

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

export function flattenPaths(value, prefix = '') {
  throw new Error('TODO');
}

export function unflattenPaths(flat) {
  throw new Error('TODO');
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
