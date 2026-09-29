// ─────────────────────────────────────────────────────────────────────────
//  12 · review this PR                                     ★★★ stretch
//  concepts: everything in 01–11, three of them at once
//  run: node ../run.js exercises/12-boss-review.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A colleague opens a PR: "tiny inventory service, tsc is green, ready
//  for review." tsc IS green. Three bugs got past it anyway — one each in
//  three of the classes you met in 01–11, independent of each other.
//
//  The contract the tests hold this file to:
//
//    [create]  qty defaults to 0 and the reorder point to 5, but a value
//              the caller SUPPLIED is kept — reorderAt: 0 means "never
//              reorder", not "use the default"
//    [apply]   receive adds, ship subtracts and never goes below zero,
//              correct sets the count outright (a stock count found 7 on
//              the shelf → the count is 7). Rows with another sku are
//              returned untouched
//    [plan]    the restock plan lists every item at or under its reorder
//              point, lowest count first, and leaves the caller's list in
//              the order it arrived
//
//      createItem({ sku:'a', name:'A', reorderAt: 0 }).reorderAt   → 0
//      applyAll(items, [{ kind:'correct', sku:'a', qty:7 }])       → qty 7
//      restockPlan(items)   → the low rows, and `items` still in its
//                             original order afterwards
//
//  Three of the ten tests below are red, one per bug, and each test name
//  tells you which area to look in. Fix all three with the smallest edits
//  you can. Do not restructure the module.
//
//  hint: work one red test at a time and do not read the whole file
//  first. For each: name the value that is wrong, find the ONE expression
//  that produced it, then ask why the type system had no opinion.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Item {
  sku: string;
  name: string;
  qty: number;
  reorderAt: number;
}

export interface ItemInput {
  sku: string;
  name: string;
  qty?: number;
  reorderAt?: number;
}

export type Adjustment =
  | { kind: 'receive'; sku: string; qty: number }
  | { kind: 'ship'; sku: string; qty: number }
  | { kind: 'correct'; sku: string; qty: number };

const DEFAULT_REORDER_AT = 5;

export function createItem(input: ItemInput): Item {
  return {
    sku: input.sku,
    name: input.name,
    qty: input.qty ?? 0,
    reorderAt: input.reorderAt || DEFAULT_REORDER_AT,
  };
}

export function applyAdjustment(items: Item[], adj: Adjustment): Item[] {
  return items.map((item) => {
    if (item.sku !== adj.sku) return item;
    switch (adj.kind) {
      case 'receive':
        return { ...item, qty: item.qty + adj.qty };
      case 'ship':
        return { ...item, qty: Math.max(0, item.qty - adj.qty) };
      default:
        return item;
    }
  });
}

export function applyAll(items: Item[], adjustments: Adjustment[]): Item[] {
  return adjustments.reduce(applyAdjustment, items);
}

export function restockPlan(items: Item[]): Item[] {
  const ordered = items.sort((a, b) => a.qty - b.qty);
  return ordered.filter((item) => item.qty <= item.reorderAt);
}

// ─────────────────────────── runtime tests ───────────────────────────────

function stock(): Item[] {
  return [
    createItem({ sku: 'bolt', name: 'Bolt', qty: 40, reorderAt: 10 }),
    createItem({ sku: 'nut', name: 'Nut', qty: 3, reorderAt: 10 }),
    createItem({ sku: 'washer', name: 'Washer', qty: 8 }),
  ];
}

test('[create] the fields left out take their defaults', () => {
  eq(createItem({ sku: 'a', name: 'A' }), {
    sku: 'a',
    name: 'A',
    qty: 0,
    reorderAt: 5,
  });
});

test('[create] a supplied reorder point is kept', () => {
  eq(createItem({ sku: 'a', name: 'A', reorderAt: 12 }).reorderAt, 12);
});

test('[create] a reorder point of zero means never reorder', () => {
  eq(createItem({ sku: 'a', name: 'A', reorderAt: 0 }).reorderAt, 0);
});

test('[apply] receive adds to the matching row', () => {
  const after = applyAll(stock(), [{ kind: 'receive', sku: 'nut', qty: 12 }]);
  eq(after[1].qty, 15);
});

test('[apply] ship subtracts and stops at zero', () => {
  const after = applyAll(stock(), [
    { kind: 'ship', sku: 'bolt', qty: 10 },
    { kind: 'ship', sku: 'nut', qty: 99 },
  ]);
  eq(after[0].qty, 30);
  eq(after[1].qty, 0);
});

test('[apply] correct sets the count outright', () => {
  const after = applyAll(stock(), [{ kind: 'correct', sku: 'nut', qty: 7 }]);
  eq(after[1].qty, 7);
});

test('[apply] rows with another sku come back untouched', () => {
  const before = stock();
  const after = applyAll(before, [{ kind: 'receive', sku: 'nut', qty: 1 }]);
  eq(after[0], before[0]);
  eq(after[2], before[2]);
});

test('[plan] lists what is at or under its reorder point', () => {
  eq(
    restockPlan(stock()).map((item) => item.sku),
    ['nut']
  );
});

test('[plan] puts the lowest count first', () => {
  const low = stock().concat(createItem({ sku: 'pin', name: 'Pin', qty: 1 }));
  eq(
    restockPlan(low).map((item) => item.sku),
    ['pin', 'nut']
  );
});

test('[plan] leaves the list it was given in its original order', () => {
  const items = stock();
  restockPlan(items);
  eq(
    items.map((item) => item.sku),
    ['bolt', 'nut', 'washer']
  );
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof createItem>, Item>>;
type _t2 = Expect<Equal<Adjustment['kind'], 'receive' | 'ship' | 'correct'>>;

function _typeTests() {
  const item: Item = createItem({ sku: 'a', name: 'A' });
  use(item);

  // @ts-expect-error — an item needs a name
  createItem({ sku: 'a' });

  // @ts-expect-error — 'destroy' is not an adjustment
  applyAll([], [{ kind: 'destroy', sku: 'a', qty: 1 }]);

  // @ts-expect-error — a quantity is a number
  applyAll([], [{ kind: 'ship', sku: 'a', qty: '1' }]);
}
use(_typeTests);
