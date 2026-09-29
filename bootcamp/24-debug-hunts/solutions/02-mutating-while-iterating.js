// ─────────────────────────────────────────────────────────────────────────
//  02 · purgeExpired — SOLUTION                              ★☆☆ warm-up
//  run: node 02-mutating-while-iterating.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: mutation during iteration. The loop and the array
//  disagree about what index `i` means, and the array wins.
//
//  The tell: `sessions.splice(i, 1)` inside a loop that also does `i++`.
//  Removing element i slides every later element down one slot, so the
//  next item is now AT i — and then `i++` steps straight over it. Every
//  second member of a run of expired sessions survives.
//
//  The fix: walk backwards, so removals only ever disturb indices you
//  have already passed:
//
//      for (let i = sessions.length - 1; i >= 0; i--)
//
//  The other one-line fix is `sessions.splice(i, 1); i--;`, which works
//  but re-reads worse. In the wild the same bug wears a second costume:
//  `list.forEach(...)` with a splice inside — forEach walks a live index
//  too, so it skips exactly the same way, and quietly.

import { test, eq, ok } from '../../_lib/check.js';

// Expiry times are plain numbers, not clock readings, so nothing here
// depends on when you run it. Fresh copy per test.
const makeSessions = () => [
  { id: 's1', user: 'ada', expiresAt: 100 },
  { id: 's2', user: 'bo', expiresAt: 900 },
  { id: 's3', user: 'cy', expiresAt: 200 },
  { id: 's4', user: 'dee', expiresAt: 300 },
  { id: 's5', user: 'eve', expiresAt: 900 },
];

const ids = (sessions) => sessions.map((s) => s.id);

export function purgeExpired(sessions, now) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const session = sessions[i];
    if (session.expiresAt <= now) {
      sessions.splice(i, 1);
    }
  }
  return sessions;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('drops a single expired session', () => {
  eq(ids(purgeExpired(makeSessions(), 150)), ['s2', 's3', 's4', 's5']);
});

test('keeps everything when nothing has expired yet', () => {
  eq(ids(purgeExpired(makeSessions(), 50)), ['s1', 's2', 's3', 's4', 's5']);
  eq(purgeExpired([], 999), []);
});

test('drops a run of two expired sessions sitting side by side', () => {
  eq(ids(purgeExpired(makeSessions(), 500)), ['s2', 's5']);
});

test('mutates the array it was handed and returns that same array', () => {
  const live = makeSessions();
  const out = purgeExpired(live, 150);
  ok(out === live, 'should return the same array object, not a copy');
  eq(ids(live), ['s2', 's3', 's4', 's5']);
});

test('an expiry exactly at now counts as expired', () => {
  const list = [
    { id: 'a', expiresAt: 500 },
    { id: 'b', expiresAt: 501 },
  ];
  eq(ids(purgeExpired(list, 500)), ['b']);
});

test('purging a fully expired list leaves it empty', () => {
  eq(ids(purgeExpired(makeSessions(), 900)), []);
});

test('the survivors keep their original order', () => {
  eq(ids(purgeExpired(makeSessions(), 250)), ['s2', 's4', 's5']);
});
