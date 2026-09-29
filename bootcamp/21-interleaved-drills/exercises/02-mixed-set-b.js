// ─────────────────────────────────────────────────────────────────────────
//  02 · mixed set B                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 02-mixed-set-b.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs behind the counter of a bakery. No hints. One sitting.
//
//    const ring = detachRing(register);   ring(3) → 'front: 3'
//      (the register object is below; `ring` is called with no receiver)
//    countByPastry(ORDERS)   → { croissant: 3, baguette: 1, danish: 2 }
//    sortOrders(ORDERS)      → the same orders, earliest hour first,
//                              ties broken by name A→Z
//    await safeBake(task)    → { ok: true, value } or { ok: false, error }
//                              where `error` is the message string
//    busiestHour(ORDERS)     → 9   (ties go to the earlier hour)
//
//  ORDERS is frozen.

import { test, eq } from '../../_lib/check.js';

const ORDERS = Object.freeze([
  { id: 'o1', name: 'Ada', pastry: 'croissant', hour: 9, qty: 2 },
  { id: 'o2', name: 'Bo', pastry: 'baguette', hour: 7, qty: 1 },
  { id: 'o3', name: 'Cyd', pastry: 'croissant', hour: 9, qty: 4 },
  { id: 'o4', name: 'Ada', pastry: 'danish', hour: 7, qty: 1 },
  { id: 'o5', name: 'Eli', pastry: 'croissant', hour: 11, qty: 3 },
  { id: 'o6', name: 'Bo', pastry: 'danish', hour: 9, qty: 2 },
]);

const makeRegister = () => ({
  name: 'front',
  taken: 0,
  ring(amount) {
    this.taken += amount;
    return `${this.name}: ${this.taken}`;
  },
});

export function detachRing(register) {
  throw new Error('TODO');
}

export function countByPastry(orders) {
  throw new Error('TODO');
}

export function sortOrders(orders) {
  throw new Error('TODO');
}

export async function safeBake(task) {
  throw new Error('TODO');
}

export function busiestHour(orders) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a method pulled off its object still finds its receiver', () => {
  const register = makeRegister();
  const ring = detachRing(register);
  eq(ring(3), 'front: 3');
  eq(register.taken, 3);
});

test('and it tracks the object, not a snapshot of it', () => {
  const register = makeRegister();
  const ring = detachRing(register);
  ring(3);
  register.name = 'back';
  eq(ring(2), 'back: 5');
});

test('orders tally by pastry', () => {
  eq(countByPastry(ORDERS), { croissant: 3, baguette: 1, danish: 2 });
  eq(countByPastry([]), {});
});

test('the queue sorts by hour, then by name', () => {
  eq(sortOrders(ORDERS).map((o) => o.id), ['o4', 'o2', 'o1', 'o6', 'o3', 'o5']);
});

test('sorting returns a new array and leaves the frozen one alone', () => {
  const sorted = sortOrders(ORDERS);
  eq(ORDERS.map((o) => o.id), ['o1', 'o2', 'o3', 'o4', 'o5', 'o6']);
  eq(sorted === ORDERS, false);
});

test('a rejected bake comes back as a value, not a rejection', async () => {
  eq(await safeBake(async () => 'loaf'), { ok: true, value: 'loaf' });
  eq(
    await safeBake(async () => {
      throw new Error('oven cold');
    }),
    { ok: false, error: 'oven cold' }
  );
});

test('the busiest hour breaks ties in favour of the earlier one', () => {
  eq(busiestHour(ORDERS), 9);
  eq(
    busiestHour([
      { hour: 14 },
      { hour: 8 },
      { hour: 14 },
      { hour: 8 },
      { hour: 6 },
    ]),
    8
  );
});
