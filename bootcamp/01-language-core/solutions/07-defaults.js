// ─────────────────────────────────────────────────────────────────────────
//  07 · withDefaults — SOLUTION                                 ★★☆ core
//  run: node 07-defaults.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: iterate the SHAPE (the default keys), not the input. That
//  gives you the "drop unknown keys" behaviour for free and guarantees
//  every key exists in the result.
//
//  `source[key] ?? DEFAULTS[key]` is the whole trick: ?? only fires on
//  null and undefined, so 0, '' and false survive. The classic wrong turn
//  is `{ ...DEFAULTS, ...options }` — it looks equivalent but an explicit
//  `{ retries: null }` would overwrite the default with null, and it also
//  copies unknown keys straight through.

import { test, eq, ok } from '../../_lib/check.js';

export const DEFAULTS = Object.freeze({
  volume: 50,
  label: 'untitled',
  retries: 3,
  verbose: false,
});

export function withDefaults(options) {
  const source = options ?? {};
  const result = {};
  for (const key of Object.keys(DEFAULTS)) {
    result[key] = source[key] ?? DEFAULTS[key];
  }
  return result;
}

export function orDefault(value, fallback) {
  return value ?? fallback;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('fills in every default when nothing is provided', () => {
  eq(withDefaults({}), {
    volume: 50,
    label: 'untitled',
    retries: 3,
    verbose: false,
  });
});

test('keeps an explicit 0 — the classic || bug', () => {
  eq(withDefaults({ volume: 0 }).volume, 0);
});

test('keeps an explicit empty string and an explicit false', () => {
  eq(withDefaults({ label: '' }).label, '');
  eq(withDefaults({ verbose: false }).verbose, false);
});

test('null and undefined both mean "use the default"', () => {
  eq(withDefaults({ retries: null }).retries, 3);
  eq(withDefaults({ retries: undefined }).retries, 3);
});

test('returns a fresh object and mutates nothing', () => {
  const input = Object.freeze({ volume: 11 });
  const result = withDefaults(input);
  ok(result !== input, 'should not hand back the input object');
  ok(result !== DEFAULTS, 'should not hand back DEFAULTS');
  eq(input, { volume: 11 });
  eq(DEFAULTS.volume, 50);
});

test('drops keys that are not part of the settings shape', () => {
  eq(withDefaults({ nope: 1, volume: 7 }), {
    volume: 7,
    label: 'untitled',
    retries: 3,
    verbose: false,
  });
});

test('orDefault falls back only for null and undefined', () => {
  eq(orDefault(0, 9), 0);
  eq(orDefault('', 'x'), '');
  eq(orDefault(false, true), false);
  eq(orDefault(null, 9), 9);
  eq(orDefault(undefined, 9), 9);
});
