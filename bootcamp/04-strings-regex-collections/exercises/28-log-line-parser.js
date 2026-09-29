// ─────────────────────────────────────────────────────────────────────────
//  28 · parsing log lines                                        ★★☆ core
//  concepts: anchored named groups · Date from ISO · counting Map
//  run: node 28-log-line-parser.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every log file you will ever grep looks like this: a timestamp, a
//  level, then free text. Turn one line into an object, and a pile of
//  lines into a per-level tally.
//
//      parseLogLine('2026-08-20T14:03:11Z ERROR gateway timed out')
//        → { at: Date(2026-08-20T14:03:11.000Z),
//            level: 'ERROR',
//            message: 'gateway timed out' }
//
//      parseLogLine('not a log line')          → null
//      parseLogLine('2026-08-20T14:03:11Z oops hi') → null
//
//      countByLevel(LINES)  → Map { 'INFO' → 2, 'ERROR' → 1 }
//
//  The level is one of DEBUG, INFO, WARN, ERROR — anything else means the
//  line is not a log line. Exactly one space separates the fields, and
//  everything after that space is the message, extra spaces and all.
//  countByLevel ignores lines that do not parse and keeps the levels in
//  first-seen order.
//
//  hint: anchor the pattern with ^…$ so a half-matching line is rejected,
//  and build the Date straight from the captured ISO string — it ends in
//  'Z', so it parses as UTC everywhere on earth.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: a scrap of a real log, junk lines included.
const LINES = [
  '2026-08-20T14:03:11Z INFO  boot',
  'garbage from another tool',
  '2026-08-20T14:03:12Z ERROR gateway timed out',
  '2026-08-20T14:03:13Z INFO  retrying',
  '2026-08-20T14:03:14Z WARN  slow response: 900ms',
];

export function parseLogLine(line) {
  throw new Error('TODO');
}

export function countByLevel(lines) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('pulls the timestamp, level and message apart', () => {
  const entry = parseLogLine('2026-08-20T14:03:11Z ERROR gateway timed out');
  eq(entry.level, 'ERROR');
  eq(entry.message, 'gateway timed out');
});

test('the timestamp becomes a real Date, read in UTC', () => {
  const entry = parseLogLine('2026-08-20T14:03:11Z INFO boot');
  eq(entry.at instanceof Date, true);
  eq(entry.at.toISOString(), '2026-08-20T14:03:11.000Z');
  eq(entry.at.getUTCHours(), 14);
});

test('the message keeps its own spaces and punctuation', () => {
  const entry = parseLogLine('2026-01-05T00:00:00Z WARN  slow: 900ms');
  eq(entry.message, ' slow: 900ms');
});

test('returns null for a line that is not shaped like a log line', () => {
  eq(parseLogLine('garbage from another tool'), null);
  eq(parseLogLine(''), null);
});

test('returns null for a level it does not know', () => {
  eq(parseLogLine('2026-08-20T14:03:11Z TRACE hello'), null);
  eq(parseLogLine('2026-08-20T14:03:11Z error hello'), null);
});

test('countByLevel tallies each level', () => {
  const counts = countByLevel(LINES);
  eq(counts.get('INFO'), 2);
  eq(counts.get('ERROR'), 1);
  eq(counts.get('WARN'), 1);
});

test('countByLevel ignores lines that do not parse', () => {
  eq(countByLevel(LINES).size, 3);
  eq(countByLevel(['nope', '']).size, 0);
});

test('countByLevel keeps the levels in first-seen order', () => {
  eq([...countByLevel(LINES).keys()], ['INFO', 'ERROR', 'WARN']);
});
