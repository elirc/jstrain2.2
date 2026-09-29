// ─────────────────────────────────────────────────────────────────────────
//  01 · updateSettings                                      ★☆☆ warm-up
//  concepts: Partial · optional properties · patch merges
//  run: node ../run.js exercises/01-partial-patch.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A settings panel sends a patch: "change the font size, leave the rest
//  alone". The patch has the same keys as Settings, every one optional —
//  that shape has a name, and you should never hand-write it.
//
//      updateSettings({ theme: 'dark', fontSize: 14, autosave: true },
//                     { fontSize: 18 })
//        → { theme: 'dark', fontSize: 18, autosave: true }
//
//  Two jobs: spell SettingsPatch with a built-in utility, and merge so an
//  explicitly-undefined value means "no change" — a plain spread does the
//  opposite and wipes the field out.
//
//  hint: Object.entries → filter → Object.fromEntries drops the undefineds

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  autosave: boolean;
}

export type SettingsPatch = TODO;

export function updateSettings(
  current: Settings,
  patch: SettingsPatch
): Settings {
  throw new Error('TODO');
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
