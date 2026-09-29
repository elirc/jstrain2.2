// ─────────────────────────────────────────────────────────────────────────
//  14 · defensive boundary                                  ★★★ stretch
//  concepts: normalizing input · defensive copies · Object.freeze
//  run: node 14-defensive-boundary.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A module with state has two leaks. Messy values get IN (' DARK ' is
//  not 'dark'), and live references get OUT — hand a caller your internal
//  object and they can rewrite your state by accident, from anywhere,
//  with no stack trace pointing at you.
//
//  createSettings(initial) → { get, update }
//
//    on the way IN (both initial and every update patch):
//        theme     → String, trimmed, lowercased      default 'light'
//        fontSize  → Number; throws 'fontSize must be a number' if it
//                    isn't finite                      default 14
//        tags      → array, each trimmed + lowercased, blanks dropped
//                                                      default []
//        any other key → throws 'unknown setting: <key>'
//
//    on the way OUT: get() and update() return a FROZEN copy — mutating
//    it, or the object you passed in, must not touch the settings.
//
//      const s = createSettings({ theme: ' DARK ', tags: [' JS ', ''] });
//      s.get()             → { theme:'dark', fontSize:14, tags:['js'] }
//      s.update({ fontSize: '18' }).fontSize  → 18
//
//  hint: Object.freeze is shallow — the tags array needs its own copy
//  and its own freeze.

import { test, eq, ok } from '../../_lib/check.js';

export function createSettings(initial) {
  throw new Error('TODO');
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
