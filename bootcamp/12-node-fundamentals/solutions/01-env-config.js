// ─────────────────────────────────────────────────────────────────────────
//  01 · env config — SOLUTION                               ★☆☆ warm-up
//  run: node 01-env-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one function owns the "is it set?" question and the other
//  two build on it, so the empty-string rule lives in exactly one place.
//  The fallback is passed down as a string (`String(fallback)`) so a
//  fallback of 3000 or false goes through the same parsing path as a real
//  env value — no second code path to keep in sync.
//  The classic wrong turn is `env[name] || fallback`: that also swallows
//  a legitimate '0', and it hides a typo'd required variable behind a
//  default instead of crashing at boot where you can see it.

import { test, eq, throws } from '../../_lib/check.js';

export function readEnv(env, name, fallback) {
  const raw = env[name];
  if (raw !== undefined && raw !== '') return raw;
  if (fallback !== undefined) return fallback;
  throw new Error(`missing required env var: ${name}`);
}

export function readNumberEnv(env, name, fallback) {
  const raw = readEnv(env, name, fallback === undefined ? undefined : String(fallback));
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`env var ${name} must be a number, got ${JSON.stringify(raw)}`);
  }
  return value;
}

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);
const FALSY = new Set(['0', 'false', 'no', 'off']);

export function readBoolEnv(env, name, fallback) {
  const raw = readEnv(env, name, fallback === undefined ? undefined : String(fallback));
  const word = String(raw).trim().toLowerCase();
  if (TRUTHY.has(word)) return true;
  if (FALSY.has(word)) return false;
  throw new Error(`env var ${name} must be a boolean, got ${JSON.stringify(raw)}`);
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
