// ─────────────────────────────────────────────────────────────────────────
//  01 · mixed set A                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 01-mixed-set-a.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five unrelated jobs around a bike-share kiosk. No hints. One sitting.
//
//    mergeKioskConfig({ docks: 12, label: 'Main' }, { label: '' })
//      → { docks: 12, label: '' }
//    formatDock({ dockId: 3, bike: { code: 'B9' } })  → 'dock 3 · B9'
//    formatDock()                                     → 'dock ? · empty'
//    const next = makeDockCounter();  next() → 1;  next() → 2
//    bikeStatus('rented') → 'in use'
//      free → 'ready' · rented → 'in use' · broken → 'needs service'
//      anything else → 'unknown'
//    parseKioskTag('id=7;city=oslo') → { id: '7', city: 'oslo' }
//
//  A key the overrides never mention — or mention as undefined or null —
//  falls back to the default. Everything else wins.

import { test, eq } from '../../_lib/check.js';

export function mergeKioskConfig(defaults, overrides) {
  throw new Error('TODO');
}

export function formatDock(dock) {
  throw new Error('TODO');
}

export function makeDockCounter() {
  throw new Error('TODO');
}

export function bikeStatus(code) {
  throw new Error('TODO');
}

export function parseKioskTag(text) {
  throw new Error('TODO');
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
