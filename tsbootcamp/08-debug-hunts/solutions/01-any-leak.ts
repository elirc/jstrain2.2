// ─────────────────────────────────────────────────────────────────────────
//  01 · the any leak — SOLUTION                            ★☆☆ warm-up
//  run: node ../run.js solutions/01-any-leak.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — an `any` from outside the program, spreading inwards.
//
//  THE TELL — a field that is always the default, no matter what the
//  input says. Two lines read the payload correctly and one does not,
//  which points at the reading, not at the parsing.
//
//  The typo is `raw.retryCount` where the payload says `retries`.
//
//  WHY TSC COULD NOT CATCH IT — `JSON.parse` is declared as returning
//  `any`, and `any` is not "some type I do not know"; it is "stop
//  checking". Every property access on it is legal, spelled right or not,
//  and the resulting `any` is assignable to `number` without a murmur.
//  The whole `Settings` interface above is describing a shape nothing has
//  ever compared against the data.
//
//  THE FIX — one word at the field, and one annotation at the boundary:
//  `JSON.parse(json) as Partial<Settings>`. Now the misspelling is a
//  compile error (TS2339) rather than an `undefined` three functions
//  downstream, and `??` sees `number | undefined` — exactly the type
//  that makes a default meaningful.
//
//  `as Partial<Settings>` is still a claim about data nobody validated
//  (02 is about exactly that lie). It is a much smaller one: it says
//  "the fields I read have the types I expect, or are missing", which is
//  the honest description of a config file. When it has to be airtight,
//  a guard replaces the assertion and nothing else in the file changes —
//  which is the payoff of doing this in ONE place at the boundary.

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
  const raw = JSON.parse(json) as Partial<Settings>;
  return {
    retries: raw.retries ?? DEFAULTS.retries,
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
