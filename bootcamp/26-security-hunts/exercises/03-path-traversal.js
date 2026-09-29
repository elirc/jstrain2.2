// ─────────────────────────────────────────────────────────────────────────
//  03 · the download that escapes its folder                 ★★☆ core
//  concepts: security · path traversal · containment
//  run: node 03-path-traversal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  safeJoin(baseDir, userPath) builds the absolute path for a
//  user-requested file, which MUST stay inside baseDir. A request that
//  tries to climb out is refused with an Error containing 'outside':
//
//      safeJoin('/srv/files', 'reports/q1.pdf')  → '/srv/files/reports/q1.pdf'
//      safeJoin('/srv/files', '../../etc/passwd') → throws 'outside'
//
//  A download endpoint used this, and someone fetched /etc/passwd by
//  putting ../ in the filename.
//
//  The code below is fully written — and a security hole. 3 tests fail:
//  they pass climbing paths. Find the flaw and fix it with the smallest
//  change. Keep the legitimate cases working.
//
//  hint: `path.posix.join` happily resolves `..` segments — joining is
//  not checking. After you build the full path, what must be true about
//  it relative to baseDir, and are you testing that anywhere?

import { test, eq, throws } from '../../_lib/check.js';
import path from 'node:path';

const p = path.posix; // fixed separator so the test is OS-independent

export function safeJoin(baseDir, userPath) {
  const base = p.resolve('/', baseDir);
  const full = p.join(base, userPath);
  return full;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a plain filename resolves inside the base dir', () => {
  eq(safeJoin('/srv/files', 'report.pdf'), '/srv/files/report.pdf');
});

test('a nested path inside the base dir is fine', () => {
  eq(safeJoin('/srv/files', 'reports/q1.pdf'), '/srv/files/reports/q1.pdf');
});

test('climbing out with ../ is refused', () => {
  throws(() => safeJoin('/srv/files', '../../etc/passwd'), 'outside');
});

test('an absolute user path cannot jump to the filesystem root', () => {
  throws(() => safeJoin('/srv/files', '/etc/passwd'), 'outside');
});

test('a sneaky path that climbs then re-enters is still refused', () => {
  throws(() => safeJoin('/srv/files', 'reports/../../secret'), 'outside');
});
