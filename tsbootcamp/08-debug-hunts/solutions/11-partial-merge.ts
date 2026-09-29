// ─────────────────────────────────────────────────────────────────────────
//  11 · the override that got overridden — SOLUTION        ★★★ stretch
//  run: node ../run.js solutions/11-partial-merge.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — precedence expressed as position, and the positions in
//  the wrong order.
//
//  THE TELL — every single-layer test passes and only the CONFLICTS are
//  wrong. A merge that is right until two layers disagree is never a
//  missing key or a bad type; it is an ordering question, and there is
//  exactly one place ordering is expressed.
//
//      { ...DEFAULT_PREFS, ...person, ...workspace }
//                                     ^^^^^^^^^^^^ last, so it wins
//
//  Read a spread left to right as "…and then this one wins". The comment
//  above the function says person beats workspace; the code says the
//  opposite. Later spreads overwrite earlier ones, so the most specific
//  layer goes LAST — the reverse of how the precedence sentence reads,
//  which is precisely why this is easy to get backwards.
//
//  WHY TSC COULD NOT CATCH IT — object spread is order-sensitive at
//  runtime and order-INSENSITIVE in the resulting type. Every layer here
//  is `Partial<Prefs>`, so each key's type is the same whichever spread
//  supplied it, and the result is a `Prefs` either way. TypeScript
//  computes what the object CAN CONTAIN; the question "which layer's
//  value ended up in it" is not a typing question at all.
//
//  THE FIX — swap the two spreads: `{ ...DEFAULT_PREFS, ...workspace,
//  ...person }`.
//
//  Two things worth carrying. Nested blocks are replaced whole, never
//  merged — spread is one level deep, so a layer that sets
//  `notifications` owns both flags; a deep merge is a different
//  function with different semantics, and it is worth being explicit
//  about which one you meant. And an explicit `undefined` in a layer
//  still overwrites (`{...{ theme: 'dark' }, ...{ theme: undefined }}`
//  is undefined, not 'dark') — `exactOptionalPropertyTypes` is the flag
//  that starts arguing about it.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Prefs {
  theme: 'light' | 'dark';
  fontSize: number;
  density: 'cosy' | 'compact';
  notifications: { email: boolean; push: boolean };
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'light',
  fontSize: 14,
  density: 'cosy',
  notifications: { email: true, push: false },
};

// precedence: person beats workspace beats the shipped defaults
export function resolvePrefs(
  workspace: Partial<Prefs>,
  person: Partial<Prefs>
): Prefs {
  return { ...DEFAULT_PREFS, ...workspace, ...person };
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('no overrides anywhere is the shipped defaults', () => {
  eq(resolvePrefs({}, {}), DEFAULT_PREFS);
});

test('a workspace setting beats the default', () => {
  eq(resolvePrefs({ theme: 'dark' }, {}).theme, 'dark');
});

test('a personal setting beats the default', () => {
  eq(resolvePrefs({}, { fontSize: 18 }).fontSize, 18);
});

test('settings from two layers land side by side', () => {
  const prefs = resolvePrefs({ fontSize: 18 }, { density: 'compact' });
  eq(prefs.fontSize, 18);
  eq(prefs.density, 'compact');
  eq(prefs.theme, 'light');
});

test('the person wins wherever both layers have an opinion', () => {
  const prefs = resolvePrefs(
    { theme: 'dark', fontSize: 12 },
    { theme: 'light', fontSize: 20 }
  );
  eq(prefs.theme, 'light');
  eq(prefs.fontSize, 20);
});

test('a nested block belongs to the last layer that set it', () => {
  const prefs = resolvePrefs(
    { notifications: { email: false, push: false } },
    { notifications: { email: true, push: true } }
  );
  eq(prefs.notifications, { email: true, push: true });
});

test('resolving never edits the shipped defaults', () => {
  resolvePrefs({ theme: 'dark' }, { fontSize: 20 });
  eq(DEFAULT_PREFS, {
    theme: 'light',
    fontSize: 14,
    density: 'cosy',
    notifications: { email: true, push: false },
  });
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof resolvePrefs>, Prefs>>;
type _t2 = Expect<Equal<Partial<Prefs>['theme'], 'light' | 'dark' | undefined>>;

function _typeTests() {
  const prefs: Prefs = resolvePrefs({}, {});
  use(prefs);

  // @ts-expect-error — 'sepia' is not one of the themes
  resolvePrefs({ theme: 'sepia' }, {});

  // @ts-expect-error — a nested block is replaced whole, both flags
  resolvePrefs({}, { notifications: { email: true } });
}
use(_typeTests);
