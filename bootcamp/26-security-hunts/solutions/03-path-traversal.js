// ─────────────────────────────────────────────────────────────────────────
//  03 · the download that escapes its folder — SOLUTION      ★★☆ core
//  concepts: security · path traversal · containment
//  run: node 03-path-traversal.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: path traversal. `path.join` RESOLVES `..` segments —
//  it is arithmetic on paths, not a security check — so
//  `../../etc/passwd` walked straight out of the base directory, and an
//  absolute `/etc/passwd` replaced it entirely.
//  The tell: a user-controlled path joined to a base with no check on
//  the RESULT. Building the path and validating it are two separate
//  steps; the code did only the first.
//  The minimal fix: after resolving, prove the full path is still
//  inside base — and compare against `base + separator` so a sibling
//  like `/srv/files-secret` can't pass a naive prefix test:
//      const full = p.resolve(base, userPath);
//      if (full !== base && !full.startsWith(base + '/'))
//        throw new Error(`path is outside the base dir: ${userPath}`);
//      return full;
//  Use resolve (which normalizes) then the containment check; join
//  alone can't protect you.
//  In the wild: file downloads, template includes, ZIP extraction
//  ("zip-slip"), avatar uploads keyed by user-supplied name. Belt and
//  braces in production: also strip to a basename when a flat filename
//  is all you need.

import { test, eq, throws } from '../../_lib/check.js';
import path from 'node:path';

const p = path.posix; // fixed separator so the test is OS-independent

export function safeJoin(baseDir, userPath) {
  const base = p.resolve('/', baseDir);
  const full = p.resolve(base, userPath);
  if (full !== base && !full.startsWith(base + '/')) {
    throw new Error(`path is outside the base dir: ${userPath}`);
  }
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
