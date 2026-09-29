// ─────────────────────────────────────────────────────────────────────────
//  02 · human formats                                      ★☆☆ warm-up
//  concepts: numbers · units · injected clocks
//  run: node 02-human-format.js
// ─────────────────────────────────────────────────────────────────────────
//
//  '1468006' is a number. '1.4 MB' is an answer. Three formatters:
//
//      formatBytes(1_468_006)              → '1.4 MB'   (1024 per step,
//      formatBytes(1023)                   → '1023 B'    one decimal above
//      formatBytes(1536)                   → '1.5 KB'    bytes)
//
//      formatDuration(950)                 → '950ms'
//      formatDuration(123_000)             → '2m 3s'
//      formatDuration(3_723_000)           → '1h 2m'    (two parts, max)
//
//      formatRelative(now - 60_000, now)   → '1 minute ago'
//      formatRelative(now + 2 * DAY, now)  → 'in 2 days'
//      formatRelative(now - 30_000, now)   → 'just now'  (under 45s)
//
//  `now` is a parameter, not Date.now(). Units for formatRelative:
//  minutes, then hours, then days. Singular when the amount is 1.
//
//  hint: for bytes, loop `while (value >= 1024 && ...)` — the second half
//  of that condition is the part people forget

import { test, eq } from '../../_lib/check.js';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes) {
  throw new Error('TODO');
}

export function formatDuration(ms) {
  throw new Error('TODO');
}

export function formatRelative(then, now) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('formatBytes leaves small numbers in bytes', () => {
  eq(formatBytes(0), '0 B');
  eq(formatBytes(1023), '1023 B');
});

test('formatBytes steps up every 1024 with one decimal', () => {
  eq(formatBytes(1024), '1.0 KB');
  eq(formatBytes(1536), '1.5 KB');
  eq(formatBytes(1_468_006), '1.4 MB');
});

test('formatBytes stops at the biggest unit it knows', () => {
  eq(formatBytes(1024 ** 5), '1024.0 TB');
});

test('formatDuration stays in milliseconds below a second', () => {
  eq(formatDuration(0), '0ms');
  eq(formatDuration(950), '950ms');
});

test('formatDuration drops zero parts', () => {
  eq(formatDuration(1000), '1s');
  eq(formatDuration(60_000), '1m');
  eq(formatDuration(123_000), '2m 3s');
});

test('formatDuration keeps only the two biggest parts', () => {
  eq(formatDuration(3_723_000), '1h 2m');
});

test('formatRelative calls anything recent "just now"', () => {
  const now = 1_700_000_000_000;
  eq(formatRelative(now - 30_000, now), 'just now');
  eq(formatRelative(now, now), 'just now');
});

test('formatRelative picks a unit and a direction', () => {
  const now = 1_700_000_000_000;
  eq(formatRelative(now - 60_000, now), '1 minute ago');
  eq(formatRelative(now - 3 * 3_600_000, now), '3 hours ago');
  eq(formatRelative(now + 2 * 86_400_000, now), 'in 2 days');
});
