// ─────────────────────────────────────────────────────────────────────────
//  13 · parsing key=value strings — SOLUTION                 ★★★ stretch
//  run: node 13-parse-pairs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both parsers share one shape — split the outer separator,
//  skip blanks, then split each segment ONCE on the first '='. That is
//  why indexOf('=') + two slices beats split('='): 'q=a=b' must keep the
//  second '=' inside the value.
//  parseQueryString adds three rules the web demands: strip a leading
//  '?'; decode '+' to a space BEFORE decodeURIComponent (the decoder does
//  not know about '+'); and treat a repeated key as a list, promoting the
//  first value into an array on the second sighting.
//  Object.hasOwn is deliberate: `key in out` is true for 'constructor',
//  'toString' and friends, so a query string with ?constructor=1 would
//  silently take the "seen before" branch.

import { test, eq } from '../../_lib/check.js';

const decode = (part) => decodeURIComponent(part.replace(/\+/g, ' '));

export function parsePairs(text) {
  const out = {};
  for (const segment of text.split(';')) {
    if (segment === '') continue;
    const at = segment.indexOf('=');
    if (at === -1) continue;
    out[segment.slice(0, at)] = segment.slice(at + 1);
  }
  return out;
}

export function parseQueryString(query) {
  const out = {};
  const body = query.startsWith('?') ? query.slice(1) : query;

  for (const part of body.split('&')) {
    if (part === '') continue;
    const at = part.indexOf('=');
    const key = decode(at === -1 ? part : part.slice(0, at));
    const value = at === -1 ? '' : decode(part.slice(at + 1));

    if (!Object.hasOwn(out, key)) out[key] = value;
    else if (Array.isArray(out[key])) out[key].push(value);
    else out[key] = [out[key], value];
  }
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parsePairs builds an object of strings', () => {
  eq(parsePairs('a=1;b=2'), { a: '1', b: '2' });
  eq(parsePairs('n=42').n, '42');
});

test('parsePairs skips empty segments', () => {
  eq(parsePairs('a=1;;b=2;'), { a: '1', b: '2' });
});

test('parsePairs keeps an = that appears inside the value', () => {
  eq(parsePairs('q=a=b'), { q: 'a=b' });
});

test('parsePairs of an empty string is an empty object', () => {
  eq(parsePairs(''), {});
});

test('parseQueryString drops a leading question mark', () => {
  eq(parseQueryString('?a=1'), { a: '1' });
  eq(parseQueryString('a=1'), { a: '1' });
});

test('parseQueryString decodes + and percent escapes', () => {
  eq(parseQueryString('q=hello+world%21'), { q: 'hello world!' });
  eq(parseQueryString('name=Ada%20L'), { name: 'Ada L' });
});

test('parseQueryString collects a repeated key into an array', () => {
  eq(parseQueryString('a=1&b=two&a=3'), { a: ['1', '3'], b: 'two' });
  eq(parseQueryString('t=1&t=2&t=3'), { t: ['1', '2', '3'] });
});

test('parseQueryString gives a bare key an empty value', () => {
  eq(parseQueryString('flag&a=1'), { flag: '', a: '1' });
});
