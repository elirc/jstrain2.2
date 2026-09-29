// ─────────────────────────────────────────────────────────────────────────
//  02 · human formats — SOLUTION                           ★☆☆ warm-up
//  run: node 02-human-format.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: all three are the same shape — pick a unit, then format
//  one number in it. formatBytes divides while the value is still big AND
//  a bigger unit exists; without the second half of that condition a
//  petabyte-sized number walks off the end of the array and prints
//  'undefined'. formatDuration builds every part, drops the zero ones and
//  keeps the two biggest, which is why 1h 2m 3s prints as '1h 2m': at the
//  hour scale nobody cares about seconds. formatRelative takes `now` as an
//  argument instead of calling Date.now(), so the tests are fixed points
//  rather than a race against the clock — inject the clock, always.

import { test, eq } from '../../_lib/check.js';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes) {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${UNITS[unit]}`;
}

export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const parts = [];
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  if (parts.length === 0) return `${ms}ms`;
  return parts.slice(0, 2).join(' ');
}

export function formatRelative(then, now) {
  const diff = now - then;
  const abs = Math.abs(diff);
  if (abs < 45_000) return 'just now';

  let amount;
  let unit;
  if (abs < 3_600_000) {
    amount = Math.round(abs / 60_000);
    unit = 'minute';
  } else if (abs < 86_400_000) {
    amount = Math.round(abs / 3_600_000);
    unit = 'hour';
  } else {
    amount = Math.round(abs / 86_400_000);
    unit = 'day';
  }

  const label = `${amount} ${unit}${amount === 1 ? '' : 's'}`;
  return diff >= 0 ? `${label} ago` : `in ${label}`;
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
