// ─────────────────────────────────────────────────────────────────────────
//  05 · mixed set E                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 05-mixed-set-e.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs at a plant nursery. No hints. One sitting.
//
//    shipmentLabel({ plantName: 'Fern', qty: 3, from: { nursery: 'Kew' } })
//      → 'Fern ×3 from Kew'
//    shipmentLabel({ plantName: 'Ivy' })  → 'Ivy ×1 from unknown'
//    shipmentLabel()                      → 'unnamed ×1 from unknown'
//    keyByCode(plants)      → { FRN: {…}, IVY: {…} }   last duplicate wins
//    topByHeight(PLANTS, 3) → ['Monstera', 'Palm', 'Ivy']
//                             tallest first, ties broken by name A→Z
//    await settleWaterings(tasks)
//      → { done: [values…], failed: [messages…] }   nothing rejects
//    maskRef('NUR-2291-8843') → '*********8843'   (last four survive)
//
//  PLANTS is frozen.

import { test, eq } from '../../_lib/check.js';

const PLANTS = Object.freeze([
  { code: 'FRN', name: 'Fern', heightCm: 30 },
  { code: 'IVY', name: 'Ivy', heightCm: 55 },
  { code: 'MON', name: 'Monstera', heightCm: 90 },
  { code: 'PLM', name: 'Palm', heightCm: 90 },
  { code: 'CAC', name: 'Cactus', heightCm: 12 },
]);

export function shipmentLabel(shipment) {
  throw new Error('TODO');
}

export function keyByCode(plants) {
  throw new Error('TODO');
}

export function topByHeight(plants, n) {
  throw new Error('TODO');
}

export async function settleWaterings(tasks) {
  throw new Error('TODO');
}

export function maskRef(ref) {
  throw new Error('TODO');
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
