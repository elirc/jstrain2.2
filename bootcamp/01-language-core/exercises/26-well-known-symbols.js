// ─────────────────────────────────────────────────────────────────────────
//  26 · well-known symbols                                   ★★★ stretch
//  concepts: Symbol.toStringTag · Symbol.toPrimitive · coercion hints
//  run: node 26-well-known-symbols.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Well-known symbols are the hooks the language itself looks for. Two of
//  them decide how your value behaves when JavaScript converts it.
//
//  Build a temperature value that answers correctly in every context:
//
//      const t = createTemperature(21.5);
//      t.celsius                              → 21.5
//      Object.prototype.toString.call(t)      → '[object Temperature]'
//      `${t}`                                 → '21.5°C'   (hint 'string')
//      +t                                     → 21.5       (hint 'number')
//      t * 2                                  → 43         (hint 'number')
//      t + ' outside'                         → '21.5°C outside' (default)
//
//  So: hint 'number' gives the raw celsius number, and every other hint
//  gives `${celsius}°C`.
//
//  Then hottest(list) returns the hottest temperature object in a list —
//  compared with plain `>`, no .celsius reads allowed — or null when the
//  list is empty.
//
//  hint: both hooks are computed keys in the object literal:
//  `{ [Symbol.toStringTag]: 'X', [Symbol.toPrimitive](hint) { ... } }`.
//  Relational operators like `>` always ask for the 'number' hint.

import { test, eq, ok } from '../../_lib/check.js';

export function createTemperature(celsius) {
  throw new Error('TODO');
}

export function hottest(list) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the value carries its own internal tag', () => {
  const t = createTemperature(21.5);
  eq(Object.prototype.toString.call(t), '[object Temperature]');
  eq(Object.prototype.toString.call({}), '[object Object]');
});

test('the celsius number is still readable as a field', () => {
  eq(createTemperature(21.5).celsius, 21.5);
  eq(createTemperature(-4).celsius, -4);
});

test('the string hint formats it for humans', () => {
  const t = createTemperature(21.5);
  eq(`${t}`, '21.5°C');
  eq(String(t), '21.5°C');
  eq([t].join(''), '21.5°C');
});

test('the number hint hands back a real number', () => {
  const t = createTemperature(21.5);
  eq(+t, 21.5);
  eq(t * 2, 43);
  eq(Math.round(t), 22);
});

test('the default hint is what + with a string uses', () => {
  const t = createTemperature(21.5);
  eq(t + ' outside', '21.5°C outside');
});

test('zero and negatives read correctly in both directions', () => {
  const cold = createTemperature(0);
  eq(+cold, 0);
  eq(`${cold}`, '0°C');
  eq(`${createTemperature(-4)}`, '-4°C');
});

test('the hooks are symbol keys, so they stay out of the way', () => {
  const t = createTemperature(21.5);
  eq(Object.keys(t), ['celsius']);
  eq(JSON.stringify(t), '{"celsius":21.5}');
});

test('hottest compares with > and gets the number hint for free', () => {
  const cold = createTemperature(2);
  const mild = createTemperature(18);
  const hot = createTemperature(31);
  ok(hottest([cold, hot, mild]) === hot);
  ok(hottest([hot]) === hot);
  eq(hottest([]), null);
});
