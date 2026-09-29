// ─────────────────────────────────────────────────────────────────────────
//  14 · defensive boundary — SOLUTION                       ★★★ stretch
//  run: node 14-defensive-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one normalize() guards every entrance — the constructor
//  and update() both go through it, so there is exactly one place where
//  outside data becomes inside data. Rejecting unknown keys there turns
//  a silent typo (`fontsize: 18`) into an immediate, named error.
//  On the way out, snapshot() builds a new object every call and freezes
//  it. `{ ...state }` alone is not enough: freeze is shallow and a spread
//  is a shallow copy, so `tags` would still be the live array — one
//  `.push()` from a caller and your state has changed. Copy it, freeze
//  it too.
//  The same applies to the object you were handed: `{ ...DEFAULTS,
//  ...normalize(initial) }` copies the values out, so a later mutation
//  of `initial` cannot reach in.
//  Classic wrong turn: freezing the internal state instead of the copy —
//  then YOU cannot update it either.

import { test, eq, ok } from '../../_lib/check.js';

function normalize(patch) {
  for (const key of Object.keys(patch)) {
    if (!(key in DEFAULTS)) throw new Error(`unknown setting: ${key}`);
  }

  const clean = {};
  if ('theme' in patch) {
    clean.theme = String(patch.theme).trim().toLowerCase();
  }
  if ('fontSize' in patch) {
    const size = Number(patch.fontSize);
    if (!Number.isFinite(size)) throw new Error('fontSize must be a number');
    clean.fontSize = size;
  }
  if ('tags' in patch) {
    clean.tags = [...(patch.tags ?? [])]
      .map((tag) => String(tag).trim().toLowerCase())
      .filter((tag) => tag !== '');
  }
  return clean;
}

export function createSettings(initial) {
  let state = { ...DEFAULTS, tags: [], ...normalize(initial ?? {}) };

  const snapshot = () =>
    Object.freeze({ ...state, tags: Object.freeze([...state.tags]) });

  return {
    get: () => snapshot(),
    update(patch) {
      state = { ...state, ...normalize(patch ?? {}) };
      return snapshot();
    },
  };
}

// ── given: the known settings and their defaults ─────────────────────────

const DEFAULTS = { theme: 'light', fontSize: 14, tags: [] };

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('normalizes messy input at the edge', () => {
  const settings = createSettings({
    theme: '  DARK ',
    fontSize: '18',
    tags: [' JS ', '', 'Node'],
  });
  eq(settings.get(), { theme: 'dark', fontSize: 18, tags: ['js', 'node'] });
});

test('fills in defaults for anything missing', () => {
  eq(createSettings({}).get(), DEFAULTS);
});

test('the snapshot it hands out is frozen', () => {
  const settings = createSettings({});
  const snapshot = settings.get();
  ok(Object.isFrozen(snapshot));
  try {
    snapshot.theme = 'neon';
  } catch {
    // strict mode throws on a frozen write — either way, nothing changes
  }
  eq(settings.get().theme, 'light');
});

test('a caller cannot corrupt the state through the arrays either', () => {
  const settings = createSettings({ tags: ['js'] });
  const snapshot = settings.get();
  try {
    snapshot.tags.push('hacked');
  } catch {
    // frozen arrays refuse push in strict mode
  }
  eq(settings.get().tags, ['js']);
});

test('mutating the object you passed in cannot reach the settings', () => {
  const initial = { theme: 'dark', tags: ['js'] };
  const settings = createSettings(initial);
  initial.theme = 'neon';
  initial.tags.push('hacked');
  eq(settings.get(), { theme: 'dark', fontSize: 14, tags: ['js'] });
});

test('every get() is a fresh copy, not the same object', () => {
  const settings = createSettings({});
  ok(settings.get() !== settings.get());
  eq(settings.get(), settings.get());
});

test('update merges and normalizes the patch', () => {
  const settings = createSettings({ theme: 'dark', fontSize: 18 });
  eq(settings.update({ theme: ' LIGHT ' }), {
    theme: 'light',
    fontSize: 18,
    tags: [],
  });
  eq(settings.get().theme, 'light');
});

test('the boundary refuses input it does not understand', () => {
  const settings = createSettings({});
  eq(
    thrownBy(() => settings.update({ nope: 1 })).message,
    'unknown setting: nope'
  );
  eq(
    thrownBy(() => createSettings({ fontSize: 'huge' })).message,
    'fontSize must be a number'
  );
});
