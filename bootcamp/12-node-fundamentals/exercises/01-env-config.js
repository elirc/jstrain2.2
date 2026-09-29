// ─────────────────────────────────────────────────────────────────────────
//  01 · env config                                         ★☆☆ warm-up
//  concepts: process.env · defaults · validation
//  run: node 01-env-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `process.env` is a plain object whose values are always strings (or
//  undefined). Config code turns that into typed, validated values, and
//  fails loudly when something is wrong. Take the env object as the first
//  argument so the helpers are testable without touching the real process.
//
//      readEnv({ PORT: '8080' }, 'PORT')       → '8080'
//      readEnv({}, 'HOST', 'localhost')        → 'localhost'
//      readEnv({}, 'API_TOKEN')                → throws (name in message)
//      readNumberEnv({}, 'PORT', 3000)         → 3000
//      readBoolEnv({ DEBUG: 'yes' }, 'DEBUG')  → true
//
//  Rules: a variable set to '' counts as NOT set. A variable that IS set
//  but cannot be parsed always throws — never silently falls back.
//  Booleans: 1/true/yes/on and 0/false/no/off, any casing.

import { test, eq, throws } from '../../_lib/check.js';

export function readEnv(env, name, fallback) {
  throw new Error('TODO');
}

export function readNumberEnv(env, name, fallback) {
  throw new Error('TODO');
}

export function readBoolEnv(env, name, fallback) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns the value when the variable is set', () => {
  eq(readEnv({ PORT: '8080' }, 'PORT'), '8080');
});

test('falls back when the variable is missing', () => {
  eq(readEnv({}, 'HOST', 'localhost'), 'localhost');
});

test('treats an empty string as not set', () => {
  eq(readEnv({ HOST: '' }, 'HOST', 'localhost'), 'localhost');
});

test('throws with the variable name when required and missing', () => {
  eq(readEnv({ API_TOKEN: 'abc' }, 'API_TOKEN'), 'abc');
  throws(() => readEnv({}, 'API_TOKEN'), 'API_TOKEN');
});

test('readNumberEnv parses digits and honours the fallback', () => {
  eq(readNumberEnv({ PORT: '8080' }, 'PORT', 3000), 8080);
  eq(readNumberEnv({}, 'PORT', 3000), 3000);
});

test('readNumberEnv throws on junk instead of falling back', () => {
  eq(readNumberEnv({ PORT: '1' }, 'PORT'), 1);
  throws(() => readNumberEnv({ PORT: 'eighty' }, 'PORT', 3000), 'PORT');
});

test('readBoolEnv understands the usual spellings', () => {
  eq(readBoolEnv({ D: 'yes' }, 'D'), true);
  eq(readBoolEnv({ D: 'TRUE' }, 'D'), true);
  eq(readBoolEnv({ D: 'off' }, 'D'), false);
  eq(readBoolEnv({}, 'D', false), false);
  throws(() => readBoolEnv({ D: 'maybe' }, 'D'));
});

test('works against the real process.env', () => {
  eq(readEnv(process.env, 'JSTRAIN_NOT_SET_XYZ', 'default'), 'default');
});
