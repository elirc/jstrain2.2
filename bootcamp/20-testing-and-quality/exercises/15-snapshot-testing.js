// ─────────────────────────────────────────────────────────────────────────
//  15 · snapshot testing                                     ★★★ stretch
//  concepts: golden files · injected env · fs
//  run: node 15-snapshot-testing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  When the output is a big blob — rendered HTML, a formatted report, an
//  API payload — nobody hand-writes the expected value. You bless it once
//  into a file and diff against it forever. Build `toMatchSnapshot`.
//
//      snapshotTest('card', { title: 'Hi' }, { dir })
//        first run   → { status: 'written', path }   file created
//        same value  → { status: 'matched', path }
//        new value   → { status: 'mismatch', path, expected, actual }
//        new value + { dir, env: { UPDATE_SNAPSHOTS: '1' } }
//                    → { status: 'updated', path }   file rewritten
//
//  Details that the tests pin down:
//    · the file is `<safeName>.snap.json` inside `dir`, where safeName
//      replaces runs of anything outside [a-z0-9._-] with a single '-'
//      ('renders a card' → 'renders-a-card.snap.json')
//    · the content is `JSON.stringify(value, null, 2)` plus a newline
//    · `dir` may not exist yet — create it
//    · `expected` and `actual` in a mismatch are the two file-shaped
//      STRINGS, so the caller can print a diff
//    · env is a parameter, never `process.env` read from inside
//
//  hint: the update branch belongs ONLY on the mismatch path. A version
//  that writes on every run can never fail, which is how snapshot suites
//  quietly stop testing anything.

import { test, eq, ok } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

// Provided: every test gets its own directory, removed afterwards.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  mkdirSync(dir, { recursive: true });
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    try {
      rmdirSync(TMP_ROOT); // only succeeds once the last test is done
    } catch {
      /* still in use, or already gone */
    }
  }
}

export function snapshotTest(name, value, { dir, env = {} }) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the first run writes the snapshot', () => {
  withTempDir((dir) => {
    const result = snapshotTest('card', { title: 'Hi' }, { dir });
    eq(result.status, 'written');
    ok(existsSync(result.path), 'the snapshot file should exist');
  });
});

test('the file holds the pretty-printed value plus a newline', () => {
  withTempDir((dir) => {
    const result = snapshotTest('card', { title: 'Hi' }, { dir });
    eq(readFileSync(result.path, 'utf8'), '{\n  "title": "Hi"\n}\n');
  });
});

test('a second run with the same value matches', () => {
  withTempDir((dir) => {
    snapshotTest('card', { title: 'Hi', tags: ['a'] }, { dir });
    const again = snapshotTest('card', { title: 'Hi', tags: ['a'] }, { dir });
    eq(again.status, 'matched');
  });
});

test('a changed value is a mismatch that shows both sides', () => {
  withTempDir((dir) => {
    snapshotTest('card', { title: 'Hi' }, { dir });
    const result = snapshotTest('card', { title: 'Bye' }, { dir });
    eq(result.status, 'mismatch');
    eq(result.expected, '{\n  "title": "Hi"\n}\n');
    eq(result.actual, '{\n  "title": "Bye"\n}\n');
  });
});

test('a mismatch does NOT rewrite the file', () => {
  withTempDir((dir) => {
    const first = snapshotTest('card', { title: 'Hi' }, { dir });
    snapshotTest('card', { title: 'Bye' }, { dir });
    eq(readFileSync(first.path, 'utf8'), '{\n  "title": "Hi"\n}\n');
  });
});

test('UPDATE_SNAPSHOTS rewrites, and the next run matches again', () => {
  withTempDir((dir) => {
    snapshotTest('card', { title: 'Hi' }, { dir });
    const env = { UPDATE_SNAPSHOTS: '1' };
    const updated = snapshotTest('card', { title: 'Bye' }, { dir, env });
    eq(updated.status, 'updated');
    eq(readFileSync(updated.path, 'utf8'), '{\n  "title": "Bye"\n}\n');
    eq(snapshotTest('card', { title: 'Bye' }, { dir }).status, 'matched');
  });
});

test('the test name becomes a safe file name', () => {
  withTempDir((dir) => {
    const result = snapshotTest('renders a card', { ok: true }, { dir });
    eq(path.basename(result.path), 'renders-a-card.snap.json');
  });
});

test('different names get different files, and a missing dir is created', () => {
  withTempDir((dir) => {
    const nested = path.join(dir, 'deep', 'snapshots');
    const a = snapshotTest('a', { v: 1 }, { dir: nested });
    const b = snapshotTest('b', { v: 2 }, { dir: nested });
    ok(a.path !== b.path, 'two names must not share a file');
    eq(snapshotTest('a', { v: 1 }, { dir: nested }).status, 'matched');
    eq(snapshotTest('b', { v: 1 }, { dir: nested }).status, 'mismatch');
  });
});
