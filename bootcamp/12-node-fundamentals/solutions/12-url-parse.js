// ─────────────────────────────────────────────────────────────────────────
//  12 · parse URLs — SOLUTION                                 ★★☆ core
//  run: node 12-url-parse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `new URL(href)` does all the parsing; the job here is
//  knowing what the fields actually contain. protocol keeps its colon,
//  port is a string and is '' whenever the port is the default for the
//  scheme, and pathname is never empty — it is at least '/'.
//  Object.fromEntries(url.searchParams) is the quick way to a plain
//  object, and it is also the lossy one: duplicate keys collapse to the
//  last value. queryToObject keeps them by asking getAll() per unique
//  key. Wrapping keys in a Set first stops a duplicated key from being
//  processed twice.
//  URLSearchParams handles '+' as a space and undoes percent-encoding, so
//  hand-rolled decodeURIComponent(split('&')) is always a step backwards.

import { test, eq, throws } from '../../_lib/check.js';

export function describeUrl(href) {
  const url = new URL(href);
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
  };
}

export function queryToObject(search) {
  const params = new URLSearchParams(search);
  const out = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    out[key] = values.length > 1 ? values : values[0];
  }
  return out;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('splits a full URL into its parts', () => {
  eq(describeUrl('https://api.example.com:8443/v1/users?page=2&sort=name'), {
    protocol: 'https:',
    hostname: 'api.example.com',
    port: '8443',
    pathname: '/v1/users',
    query: { page: '2', sort: 'name' },
  });
});

test('the default port comes back as an empty string', () => {
  eq(describeUrl('https://example.com/').port, '');
  eq(describeUrl('http://example.com:3000/').port, '3000');
});

test('pathname is "/" when the URL has no path', () => {
  eq(describeUrl('https://example.com').pathname, '/');
  eq(describeUrl('https://example.com').query, {});
});

test('a bare path is not a URL', () => {
  eq(describeUrl('https://example.com/').protocol, 'https:');
  throws(() => describeUrl('/api/users'), 'Invalid URL');
});

test('queryToObject turns a query string into an object', () => {
  eq(queryToObject('page=2&sort=name'), { page: '2', sort: 'name' });
  eq(queryToObject('?page=2'), { page: '2' });
  eq(queryToObject(''), {});
});

test('repeated keys collapse into an array', () => {
  eq(queryToObject('tag=a&tag=b&page=1'), { tag: ['a', 'b'], page: '1' });
});

test('percent-encoding and + are decoded for you', () => {
  eq(queryToObject('q=hello+world&path=a%2Fb'), { q: 'hello world', path: 'a/b' });
});
