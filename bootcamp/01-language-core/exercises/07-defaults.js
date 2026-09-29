// ─────────────────────────────────────────────────────────────────────────
//  07 · withDefaults                                            ★★☆ core
//  concepts: ?? vs || · defaults that respect 0, '' and false
//  run: node 07-defaults.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A user sets volume to 0 and your settings screen shows 50. That bug is
//  `options.volume || 50`. Fill in missing options WITHOUT eating the
//  falsy values the user actually chose.
//
//      withDefaults({})              → { volume: 50, label: 'untitled',
//                                        retries: 3, verbose: false }
//      withDefaults({ volume: 0 })   → volume stays 0
//      withDefaults({ label: '' })   → label stays ''
//      withDefaults({ retries: null }) → retries falls back to 3
//      withDefaults({ nope: 1 })     → unknown keys are dropped
//
//      orDefault(0, 9)     → 0        orDefault(null, 9) → 9
//
//  hint: `||` replaces every falsy value. `??` only replaces null and
//  undefined — and those are the only two "not provided" values.

import { test, eq, ok } from '../../_lib/check.js';

export const DEFAULTS = Object.freeze({
  volume: 50,
  label: 'untitled',
  retries: 3,
  verbose: false,
});

export function withDefaults(options) {
  throw new Error('TODO');
}

export function orDefault(value, fallback) {
  throw new Error('TODO');
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
