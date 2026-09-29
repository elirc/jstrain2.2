// ─────────────────────────────────────────────────────────────────────────
//  11 · the override that got overridden                   ★★★ stretch
//  concepts: spread order · Partial<T> · layered configuration
//  run: node ../run.js exercises/11-partial-merge.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Three layers of preferences, most specific last:
//
//      the shipped defaults  <  the workspace  <  the person
//
//  Whatever a layer does not mention, it does not change. Whatever it
//  does mention beats every layer below it. Nested blocks are replaced
//  whole — a layer that sets `notifications` owns both of its flags.
//
//      resolvePrefs({}, {})                        → DEFAULT_PREFS
//      resolvePrefs({ theme: 'dark' }, {})         → dark  (workspace)
//      resolvePrefs({}, { fontSize: 18 })          → 18    (person)
//      resolvePrefs({ theme: 'dark' }, { theme: 'light' })
//                                                  → light (person wins)
//
//  tsc is satisfied, and so is the comment above `resolvePrefs`. The code
//  under it is not: two tests fail. Fix it with the smallest edit you
//  can, and do not restructure the function.
//
//  hint: both failures involve a key that two layers set. Say the spread
//  out loud, left to right, as "and then this one wins".

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
  return { ...DEFAULT_PREFS, ...person, ...workspace };
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
