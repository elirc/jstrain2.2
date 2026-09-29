// ─────────────────────────────────────────────────────────────────────────
//  26 · well-known symbols — SOLUTION                        ★★★ stretch
//  run: node 26-well-known-symbols.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Symbol.toPrimitive` replaces the whole valueOf/toString
//  dance. The engine hands it a hint — 'number', 'string' or 'default' —
//  and takes whatever primitive you return. `+t` and `t * 2` and `t > u`
//  all ask for 'number'; `${t}` and String(t) ask for 'string'; `+` with a
//  non-number and `==` ask for 'default'. Date is the famous value that
//  treats 'default' as a string, which is why `new Date() == 0` is false.
//
//  `Symbol.toStringTag` only changes what Object.prototype.toString reports.
//  It is cosmetic — but it is the same machinery that makes Map report
//  '[object Map]', so the tag-based type checks in exercise 02 see it too.
//
//  The classic wrong turn is defining toString/valueOf instead: that works
//  for strings and numbers but gives you no way to tell the two apart, and
//  nothing to hang the 'default' case on.

import { test, eq, ok } from '../../_lib/check.js';

export function createTemperature(celsius) {
  return {
    celsius,
    [Symbol.toStringTag]: 'Temperature',
    [Symbol.toPrimitive](hint) {
      return hint === 'number' ? celsius : `${celsius}°C`;
    },
  };
}

export function hottest(list) {
  let best = null;
  for (const item of list) {
    if (best === null || item > best) best = item;
  }
  return best;
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
