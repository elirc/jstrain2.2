// ─────────────────────────────────────────────────────────────────────────
//  02 · mixed set B — SOLUTION                             ★★☆ core
//  run: node 02-mixed-set-b.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. `this` is decided at CALL time, so `const ring = register.ring`
//     loses the receiver. `.bind(register)` freezes the receiver without
//     copying any state — the bound function still reads the live object,
//     which is why renaming the register afterwards shows through.
//  2. countBy is a reduce whose accumulator is an object of numbers:
//     `acc[key] = (acc[key] ?? 0) + 1`.
//  3. A comparator returns a NUMBER. Chain keys by falling through to the
//     next comparison only when the previous one ties, and copy the array
//     first — `.sort()` mutates, and on a frozen array it throws.
//  4. `return task()` inside a `try` returns the promise and leaves the
//     block; the rejection happens later, with nobody watching. `await`
//     inside the try is what puts the catch in the path of the error.
//  5. Counting with a Map keeps the insertion order predictable; scan for
//     the best count and only replace on a STRICT improvement, so the
//     first (earliest) hour wins a tie.

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
  return register.ring.bind(register);
}

export function countByPastry(orders) {
  return orders.reduce((tally, order) => {
    tally[order.pastry] = (tally[order.pastry] ?? 0) + 1;
    return tally;
  }, {});
}

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function sortOrders(orders) {
  return [...orders].sort((a, b) => a.hour - b.hour || byText(a.name, b.name));
}

export async function safeBake(task) {
  try {
    return { ok: true, value: await task() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function busiestHour(orders) {
  const counts = new Map();
  for (const order of orders) {
    counts.set(order.hour, (counts.get(order.hour) ?? 0) + 1);
  }
  let best;
  let bestCount = -1;
  for (const [hour, count] of counts) {
    if (count > bestCount || (count === bestCount && hour < best)) {
      best = hour;
      bestCount = count;
    }
  }
  return best;
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
