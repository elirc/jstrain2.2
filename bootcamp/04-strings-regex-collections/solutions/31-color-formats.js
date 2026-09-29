// ─────────────────────────────────────────────────────────────────────────
//  31 · hex and rgb colours — SOLUTION                        ★☆☆ warm-up
//  run: node 31-color-formats.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the anchored pattern is the validator — ^#(3 or 6 hex
//  digits)$ with the /i flag, so '#ff88000' and 'ff8800' fail instead of
//  being half-read. Expand the shorthand FIRST and the rest of the
//  function only ever sees six digits.
//  parseInt(pair, 16) needs the radix spelled out; without it '08' is
//  fine but the habit of leaving it off is how octal-looking strings bite
//  people. Going the other way, n.toString(16) drops the leading zero —
//  3 becomes '3', not '03' — so padStart(2, '0') is not optional.
//  The range check on the way in is deliberate: 'rgb(300, 0, 0)' would
//  otherwise become '#12c0000', a seven-digit string that is not a colour
//  at all.

import { test, eq } from '../../_lib/check.js';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

export function hexToRgb(hex) {
  const m = HEX.exec(hex);
  if (m === null) return null;

  const digits =
    m[1].length === 3
      ? [...m[1]].map((d) => d + d).join('')
      : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHex(rgb) {
  const m = RGB.exec(rgb);
  if (m === null) return null;

  const channels = m.slice(1, 4).map(Number);
  if (channels.some((n) => n > 255)) return null;
  return '#' + channels.map((n) => n.toString(16).padStart(2, '0')).join('');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('converts a six-digit hex colour', () => {
  eq(hexToRgb('#ff8800'), 'rgb(255, 136, 0)');
  eq(hexToRgb('#000000'), 'rgb(0, 0, 0)');
});

test('expands the three-digit shorthand', () => {
  eq(hexToRgb('#f80'), 'rgb(255, 136, 0)');
  eq(hexToRgb('#fff'), 'rgb(255, 255, 255)');
});

test('accepts upper case hex digits', () => {
  eq(hexToRgb('#FF8800'), 'rgb(255, 136, 0)');
});

test('returns null for anything that is not a hex colour', () => {
  eq(hexToRgb('#gg0000'), null);
  eq(hexToRgb('ff8800'), null);
  eq(hexToRgb('#ff88000'), null);
});

test('rgbToHex pads a single-digit channel', () => {
  eq(rgbToHex('rgb(0, 0, 0)'), '#000000');
  eq(rgbToHex('rgb(1, 2, 3)'), '#010203');
});

test('rgbToHex does not care about the spacing', () => {
  eq(rgbToHex('rgb(255,136,0)'), '#ff8800');
  eq(rgbToHex('rgb( 255 , 136 , 0 )'), '#ff8800');
});

test('rgbToHex rejects an out-of-range channel and a bad shape', () => {
  eq(rgbToHex('rgb(300, 0, 0)'), null);
  eq(rgbToHex('rgb(255, 136)'), null);
  eq(rgbToHex('255, 136, 0'), null);
});

test('the two functions round-trip', () => {
  eq(rgbToHex(hexToRgb('#1e90ff')), '#1e90ff');
  eq(hexToRgb(rgbToHex('rgb(30, 144, 255)')), 'rgb(30, 144, 255)');
});
