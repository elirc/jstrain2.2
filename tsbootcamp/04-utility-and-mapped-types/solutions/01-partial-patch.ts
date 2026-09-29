// ─────────────────────────────────────────────────────────────────────────
//  01 · updateSettings — SOLUTION                           ★☆☆ warm-up
//  run: node ../run.js solutions/01-partial-patch.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Partial<T>` is a one-line mapped type — `{ [K in keyof T]?:
//  T[K] }` — and writing the optional version of Settings by hand instead
//  is how the two definitions drift apart six months from now. Partial is
//  homomorphic ("maps over keyof T"), so it keeps `readonly` modifiers and
//  the property types; it only adds `?`.
//
//  The runtime trap: `{ ...current, ...patch }` looks right and is wrong.
//  A key that is PRESENT with the value `undefined` still wins the spread,
//  so `{ fontSize: undefined }` deletes the font size. Filtering the
//  entries first is the honest fix. (Note that at the type level Partial
//  cannot tell "absent" from "present and undefined" — that needs
//  `exactOptionalPropertyTypes`.)

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  autosave: boolean;
}

export type SettingsPatch = Partial<Settings>;

export function updateSettings(
  current: Settings,
  patch: SettingsPatch
): Settings {
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as SettingsPatch;
  return { ...current, ...defined };
}

// ─────────────────────────── runtime tests ───────────────────────────────

const base: Settings = { theme: 'dark', fontSize: 14, autosave: true };

test('applies the fields the patch names', () => {
  eq(updateSettings(base, { fontSize: 18 }), {
    theme: 'dark',
    fontSize: 18,
    autosave: true,
  });
});

test('an empty patch changes nothing', () => {
  eq(updateSettings(base, {}), base);
});

test('applies several fields at once', () => {
  eq(updateSettings(base, { theme: 'light', autosave: false }), {
    theme: 'light',
    fontSize: 14,
    autosave: false,
  });
});

test('does not mutate the settings it was given', () => {
  updateSettings(base, { fontSize: 99 });
  eq(base.fontSize, 14);
});

test('treats an explicit undefined as "no change"', () => {
  const next = updateSettings(base, { fontSize: undefined });
  eq(next.fontSize, 14);
  ok('fontSize' in next);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    SettingsPatch,
    { theme?: 'light' | 'dark'; fontSize?: number; autosave?: boolean }
  >
>;
type _t2 = Expect<Equal<ReturnType<typeof updateSettings>, Settings>>;

function _typeTests() {
  updateSettings(base, {});
  updateSettings(base, { theme: 'light' });

  const theme: 'light' | 'dark' = updateSettings(base, {}).theme;
  use(theme);

  // @ts-expect-error — colour is not a setting
  updateSettings(base, { colour: 'red' });

  // @ts-expect-error — fontSize is optional, not free-typed
  updateSettings(base, { fontSize: 'big' });

  // @ts-expect-error — the RESULT is a full Settings, nothing optional
  const incomplete: Settings = { theme: 'dark', fontSize: 14 };
  use(incomplete);
}
use(_typeTests);
