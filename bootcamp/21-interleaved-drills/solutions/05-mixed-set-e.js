// ─────────────────────────────────────────────────────────────────────────
//  05 · mixed set E — SOLUTION                             ★★☆ core
//  run: node 05-mixed-set-e.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. Rename with `:` and default with `=`, at every level, in the
//     parameter list. `qty: count = 1` keeps an explicit `0` — a default
//     only fires on `undefined`, never on a falsy value.
//  2. keyBy is a reduce into a flat object. "Last duplicate wins" is what
//     you get for free; if you wanted FIRST to win you would have to test
//     for the key before assigning.
//  3. Descending is `b - a`, not a reversed `a - b` bolted on afterwards.
//     The tie-break runs only when the first comparison returns 0, and
//     the array is copied first because `.sort()` mutates in place — on a
//     frozen array it throws outright.
//  4. `Promise.allSettled` never rejects: it hands back a status per
//     task. Partition on `status === 'fulfilled'`. With `Promise.all` a
//     single kinked hose would lose the results of every other bed.
//  5. `slice(-4)` is the tail; `padStart` rebuilds the head at the right
//     width. Short refs are returned untouched because `slice(-4)` of a
//     3-character string is the whole string.

import { test, eq } from '../../_lib/check.js';

const PLANTS = Object.freeze([
  { code: 'FRN', name: 'Fern', heightCm: 30 },
  { code: 'IVY', name: 'Ivy', heightCm: 55 },
  { code: 'MON', name: 'Monstera', heightCm: 90 },
  { code: 'PLM', name: 'Palm', heightCm: 90 },
  { code: 'CAC', name: 'Cactus', heightCm: 12 },
]);

export function shipmentLabel({
  plantName: name = 'unnamed',
  qty: count = 1,
  from: { nursery: origin = 'unknown' } = {},
} = {}) {
  return `${name} ×${count} from ${origin}`;
}

export function keyByCode(plants) {
  return plants.reduce((index, plant) => {
    index[plant.code] = plant;
    return index;
  }, {});
}

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function topByHeight(plants, n) {
  return [...plants]
    .sort((a, b) => b.heightCm - a.heightCm || byText(a.name, b.name))
    .slice(0, n)
    .map((plant) => plant.name);
}

export async function settleWaterings(tasks) {
  const results = await Promise.allSettled(tasks.map((task) => task()));
  return {
    done: results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value),
    failed: results
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason.message),
  };
}

export function maskRef(ref) {
  const tail = ref.slice(-4);
  return tail.padStart(ref.length, '*');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the label renames, defaults and reaches one level down', () => {
  eq(
    shipmentLabel({ plantName: 'Fern', qty: 3, from: { nursery: 'Kew' } }),
    'Fern ×3 from Kew'
  );
  eq(shipmentLabel({ plantName: 'Ivy' }), 'Ivy ×1 from unknown');
  eq(shipmentLabel({ plantName: 'Moss', qty: 0 }), 'Moss ×0 from unknown');
});

test('no argument at all is still a label', () => {
  eq(shipmentLabel(), 'unnamed ×1 from unknown');
});

test('the index keys by code and the last duplicate wins', () => {
  const index = keyByCode(PLANTS);
  eq(Object.keys(index), ['FRN', 'IVY', 'MON', 'PLM', 'CAC']);
  eq(index.MON.name, 'Monstera');
  eq(
    keyByCode([
      { code: 'FRN', name: 'old' },
      { code: 'FRN', name: 'new' },
    ]).FRN.name,
    'new'
  );
});

test('the tallest three, ties settled by name', () => {
  eq(topByHeight(PLANTS, 3), ['Monstera', 'Palm', 'Ivy']);
  eq(topByHeight(PLANTS, 0), []);
  eq(topByHeight(PLANTS, 99).length, 5);
});

test('ranking does not disturb the frozen catalogue', () => {
  topByHeight(PLANTS, 3);
  eq(PLANTS.map((p) => p.code), ['FRN', 'IVY', 'MON', 'PLM', 'CAC']);
});

test('every watering is accounted for — values and failures', async () => {
  const tasks = [
    async () => 'bed 1 watered',
    async () => {
      throw new Error('hose kinked');
    },
    async () => 'bed 3 watered',
    async () => {
      throw new Error('tap off');
    },
  ];
  eq(await settleWaterings(tasks), {
    done: ['bed 1 watered', 'bed 3 watered'],
    failed: ['hose kinked', 'tap off'],
  });
  eq(await settleWaterings([]), { done: [], failed: [] });
});

test('a reference keeps only its last four characters', () => {
  eq(maskRef('NUR-2291-8843'), '*********8843');
  eq(maskRef('8843'), '8843');
  eq(maskRef('843'), '843');
});
