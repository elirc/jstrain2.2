// ─────────────────────────────────────────────────────────────────────────
//  12 · parse URLs                                            ★★☆ core
//  concepts: URL · URLSearchParams · percent-encoding
//  run: node 12-url-parse.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Node has the same global URL class the browser has. Use it instead of
//  splitting on '/' and '?' — it already knows every rule you are about
//  to get wrong.
//
//      describeUrl('https://api.example.com:8443/v1/users?page=2')
//        → { protocol: 'https:',            // yes, the colon is included
//            hostname: 'api.example.com',
//            port: '8443',                  // a STRING, '' for defaults
//            pathname: '/v1/users',
//            query: { page: '2' } }
//
//      queryToObject('a=1&a=2&b=3')  → { a: ['1', '2'], b: '3' }
//      queryToObject('q=hello+world')→ { q: 'hello world' }
//
//  queryToObject accepts a query string with or without the leading '?'.
//  A key that appears once stays a string; a repeated key becomes an
//  array in the order the values appeared.
//
//  hint: new URL(href) throws on anything that is not absolute, and
//  searchParams.getAll(key) is the one that keeps duplicates.

import { test, eq, throws } from '../../_lib/check.js';

export function describeUrl(href) {
  throw new Error('TODO');
}

export function queryToObject(search) {
  throw new Error('TODO');
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
