// ─────────────────────────────────────────────────────────────────────────
//  28 · parsing log lines — SOLUTION                             ★★☆ core
//  run: node 28-log-line-parser.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one anchored pattern with three named groups does the
//  parsing, and the anchors are the whole safety story — without ^…$ the
//  regex would happily find a timestamp buried in the middle of a line of
//  someone else's output and report it as a log entry.
//  The level is spelled out as an alternation instead of \w+, so an
//  unknown level fails the match and the line is rejected rather than
//  quietly counted. exec returns null on no match, which is the shape the
//  caller wants anyway.
//  new Date(iso) is safe here because the captured text ends in 'Z': a
//  date-time WITH a zone parses the same in every timezone. (Drop the Z
//  and it would be read as local time — a bug that only shows up on a
//  colleague's laptop.)
//  countByLevel is the get-or-default counting idiom over a Map, so
//  first-seen order falls out for free; skipping the null lines keeps the
//  junk out of the tally.

import { test, eq } from '../../_lib/check.js';

// Provided scaffolding: a scrap of a real log, junk lines included.
const LINES = [
  '2026-08-20T14:03:11Z INFO  boot',
  'garbage from another tool',
  '2026-08-20T14:03:12Z ERROR gateway timed out',
  '2026-08-20T14:03:13Z INFO  retrying',
  '2026-08-20T14:03:14Z WARN  slow response: 900ms',
];

const LOG_LINE =
  /^(?<at>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z) (?<level>DEBUG|INFO|WARN|ERROR) (?<message>.*)$/;

export function parseLogLine(line) {
  const m = LOG_LINE.exec(line);
  if (m === null) return null;
  const { at, level, message } = m.groups;
  return { at: new Date(at), level, message };
}

export function countByLevel(lines) {
  const counts = new Map();
  for (const line of lines) {
    const entry = parseLogLine(line);
    if (entry === null) continue;
    counts.set(entry.level, (counts.get(entry.level) ?? 0) + 1);
  }
  return counts;
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
