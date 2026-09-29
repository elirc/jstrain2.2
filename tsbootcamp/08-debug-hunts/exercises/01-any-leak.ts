// ─────────────────────────────────────────────────────────────────────────
//  01 · the any leak                                       ★☆☆ warm-up
//  concepts: JSON.parse returns any · boundaries · silent undefined
//  run: node ../run.js exercises/01-any-leak.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `loadSettings` turns a config file's text into a `Settings`. A field
//  the file sets wins; a field it leaves out takes the default.
//
//      loadSettings('{"retries":5}').retries    → 5
//      loadSettings('{"retries":0}').retries    → 0
//      loadSettings('{}')                       → DEFAULTS, field for field
//      describeSettings('{"endpoint":"http://x","retries":2}')
//                                → 'http://x · 2 retries · verbose=false'
//
//  tsc has nothing to say about this file. It is still wrong: three tests
//  below are red. Read it, find the one bug, make the smallest change
//  that turns them green — and leave the rest of the file alone.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Settings {
  retries: number;
  endpoint: string;
  verbose: boolean;
}

export const DEFAULTS: Settings = {
  retries: 3,
  endpoint: 'http://localhost:3000',
  verbose: false,
};

export function loadSettings(json: string): Settings {
  const raw = JSON.parse(json);
  return {
    retries: raw.retryCount ?? DEFAULTS.retries,
    endpoint: raw.endpoint ?? DEFAULTS.endpoint,
    verbose: raw.verbose ?? DEFAULTS.verbose,
  };
}

export function describeSettings(json: string): string {
  const s = loadSettings(json);
  return `${s.endpoint} · ${s.retries} retries · verbose=${s.verbose}`;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('an empty file falls back to every default', () => {
  eq(loadSettings('{}'), DEFAULTS);
});

test('a file that sets every field beats every default', () => {
  eq(loadSettings('{"retries":5,"endpoint":"http://api.test","verbose":true}'), {
    retries: 5,
    endpoint: 'http://api.test',
    verbose: true,
  });
});

test('zero retries means zero, not the default', () => {
  eq(loadSettings('{"retries":0}').retries, 0);
});

test('verbose:false is a choice, not an omission', () => {
  eq(loadSettings('{"verbose":false}').verbose, false);
});

test('keys the Settings shape does not know about are ignored', () => {
  eq(loadSettings('{"colour":"blue","timeout":900}'), DEFAULTS);
});

test('the summary line reads all three fields back', () => {
  eq(
    describeSettings('{"endpoint":"http://x","retries":2,"verbose":false}'),
    'http://x · 2 retries · verbose=false'
  );
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof loadSettings>, Settings>>;

function _typeTests() {
  const s = loadSettings('{}');
  const n: number = s.retries;
  use(n);

  // @ts-expect-error — Settings has no timeout field
  s.timeout;

  // @ts-expect-error — loadSettings takes the raw text, not an object
  loadSettings({ retries: 1 });
}
use(_typeTests);
