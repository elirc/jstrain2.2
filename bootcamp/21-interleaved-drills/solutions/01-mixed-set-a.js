// ─────────────────────────────────────────────────────────────────────────
//  01 · mixed set A — SOLUTION                             ★★☆ core
//  run: node 01-mixed-set-a.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. `??` not `||`. `||` would throw away `0`, `''` and `false`, which
//     are exactly the settings a kiosk operator sets on purpose. `??`
//     only falls back on `undefined` and `null`.
//  2. Destructuring in the PARAMETER LIST, with renames and a default at
//     every level. The outer `= {}` is what makes `formatDock()` legal;
//     the inner `= {}` is what makes a missing `bike` legal.
//  3. A counter factory: `n` lives in the closure of each returned
//     function, so two counters cannot see each other's total.
//  4. A lookup table is a plain object, so it inherits `toString` and
//     friends. `Object.hasOwn` asks the object itself — or build the
//     table with `Object.create(null)` / `new Map()` and the question
//     disappears.
//  5. Splitting on the FIRST `=` only: `split('=')` then rejoin the tail,
//     otherwise `note=a=b` loses half its value.

import { test, eq } from '../../_lib/check.js';

export function mergeKioskConfig(defaults, overrides) {
  const merged = {};
  for (const key of Object.keys(defaults)) {
    merged[key] = overrides?.[key] ?? defaults[key];
  }
  return merged;
}

export function formatDock({ dockId: id = '?', bike: { code = 'empty' } = {} } = {}) {
  return `dock ${id} · ${code}`;
}

export function makeDockCounter() {
  let issued = 0;
  return () => (issued += 1);
}

const BIKE_STATUS = {
  free: 'ready',
  rented: 'in use',
  broken: 'needs service',
};

export function bikeStatus(code) {
  return Object.hasOwn(BIKE_STATUS, code) ? BIKE_STATUS[code] : 'unknown';
}

export function parseKioskTag(text) {
  const pairs = {};
  for (const segment of text.split(';')) {
    if (!segment.includes('=')) continue;
    const [key, ...rest] = segment.split('=');
    pairs[key.trim()] = rest.join('=').trim();
  }
  return pairs;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('config: missing, undefined and null overrides fall back', () => {
  const defaults = { docks: 12, label: 'Main', radiusKm: 5, debug: true };
  eq(mergeKioskConfig(defaults, { label: undefined, radiusKm: null }), {
    docks: 12,
    label: 'Main',
    radiusKm: 5,
    debug: true,
  });
});

test('config: 0, the empty string and false survive the merge', () => {
  const defaults = { docks: 12, label: 'Main', radiusKm: 5, debug: true };
  eq(mergeKioskConfig(defaults, { docks: 0, label: '', debug: false }), {
    docks: 0,
    label: '',
    radiusKm: 5,
    debug: false,
  });
});

test('dock label: reads a nested field and fills the gaps', () => {
  eq(formatDock({ dockId: 3, bike: { code: 'B9' } }), 'dock 3 · B9');
  eq(formatDock({ dockId: 4 }), 'dock 4 · empty');
});

test('dock label: called with no argument at all, it still answers', () => {
  eq(formatDock(), 'dock ? · empty');
});

test('counters: count from 1 and never share a total', () => {
  const a = makeDockCounter();
  const b = makeDockCounter();
  eq([a(), a(), a()], [1, 2, 3]);
  eq(b(), 1);
  eq(a(), 4);
});

test('status table: known codes map, inherited names do not', () => {
  eq(bikeStatus('free'), 'ready');
  eq(bikeStatus('rented'), 'in use');
  eq(bikeStatus('broken'), 'needs service');
  eq(bikeStatus('parked'), 'unknown');
  eq(bikeStatus('toString'), 'unknown');
  eq(bikeStatus('constructor'), 'unknown');
});

test('tag parsing: splits pairs, keeps empties, skips junk', () => {
  eq(parseKioskTag('id=7;city=oslo;lock='), {
    id: '7',
    city: 'oslo',
    lock: '',
  });
  eq(parseKioskTag('id=7;;broken;city=oslo'), { id: '7', city: 'oslo' });
  eq(parseKioskTag('note=a=b'), { note: 'a=b' });
  eq(parseKioskTag(''), {});
});
