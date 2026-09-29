// ─────────────────────────────────────────────────────────────────────────
//  31 · hex and rgb colours                                   ★☆☆ warm-up
//  concepts: parseInt with a radix · toString(16) · padStart
//  run: node 31-color-formats.js
// ─────────────────────────────────────────────────────────────────────────
//
//  CSS lets you write the same colour two ways. Convert between them.
//
//      hexToRgb('#ff8800')        → 'rgb(255, 136, 0)'
//      hexToRgb('#f80')           → 'rgb(255, 136, 0)'   (shorthand)
//      hexToRgb('#FF8800')        → 'rgb(255, 136, 0)'   (any case)
//      hexToRgb('#gg0000')        → null
//
//      rgbToHex('rgb(255, 136, 0)') → '#ff8800'
//      rgbToHex('rgb(0,0,0)')       → '#000000'   (spaces optional)
//      rgbToHex('rgb(300, 0, 0)')   → null        (out of range)
//
//  Shorthand doubles each digit: '#f80' is '#ff8800'. Hex output is
//  always lowercase and always six digits. Anything that is not a colour
//  in that exact shape is null — no guessing.

import { test, eq } from '../../_lib/check.js';

export function hexToRgb(hex) {
  throw new Error('TODO');
}

export function rgbToHex(rgb) {
  throw new Error('TODO');
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
