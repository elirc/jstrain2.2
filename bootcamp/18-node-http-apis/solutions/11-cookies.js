// ─────────────────────────────────────────────────────────────────────────
//  11 · cookies — SOLUTION                                     ★★☆ core
//  run: node 11-cookies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two headers with confusingly similar names and completely
//  different grammars. `Cookie` (request) is a flat list of name=value
//  pairs and carries no attributes at all — the browser strips them. Any
//  code reading Path or HttpOnly off an incoming cookie is reading
//  something that was never sent. `Set-Cookie` (response) is ONE cookie
//  plus its attributes, which is why setting three cookies means three
//  Set-Cookie headers, not one joined by commas.
//  Split each pair on the FIRST '=' only. Base64 values end in '=' and
//  signed values (exercise 12) carry more; a `split('=')` here truncates
//  the payload and the failure looks like "sessions randomly log out".
//  Percent-encode on the way out and decode on the way in: a raw ';' or
//  space in a value would otherwise end the cookie early. decodeURIComponent
//  throws on a malformed escape like '100%', so it needs a try/catch —
//  garbage in a cookie is a client problem, not a 500.
//  HttpOnly is not decoration: it is what stops document.cookie (and
//  therefore any injected script) from reading a session token.

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';

// Provided: the loopback harness from exercise 01.
async function withServer(handler, run) {
  const thrown = [];
  const server = http.createServer((req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err) => {
        thrown.push(err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end();
        }
      });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path = '/', init) => {
    const res = await fetch(base + path, init);
    const body = await res.text();
    if (thrown.length) throw thrown.shift();
    return {
      status: res.status,
      headers: res.headers,
      body,
      json: () => JSON.parse(body),
    };
  };
  try {
    return await run(request, base);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

// Provided: sendJson from exercise 01.
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

export function parseCookies(header) {
  const jar = {};
  for (const part of String(header ?? '').split(';')) {
    const pair = part.trim();
    const at = pair.indexOf('=');
    if (at < 1) continue; // no '=' at all, or an empty name
    const name = pair.slice(0, at).trim();
    if (Object.hasOwn(jar, name)) continue; // first one wins
    const raw = pair.slice(at + 1).trim();
    try {
      jar[name] = decodeURIComponent(raw);
    } catch {
      jar[name] = raw;
    }
  }
  return jar;
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it parses one cookie and a whole jar', () => {
  eq(parseCookies('sid=abc'), { sid: 'abc' });
  eq(parseCookies('sid=abc; theme=dark; lang=en'), {
    sid: 'abc',
    theme: 'dark',
    lang: 'en',
  });
});

test('no header, or a junk pair, parses to an empty jar', () => {
  eq(parseCookies(undefined), {});
  eq(parseCookies(''), {});
  eq(parseCookies('nonsense'), {});
  eq(parseCookies('=orphan'), {});
});

test('surrounding whitespace is not part of the name or value', () => {
  eq(parseCookies('  sid = abc ;theme=dark'), { sid: 'abc', theme: 'dark' });
});

test('values are percent-decoded, and malformed ones survive as-is', () => {
  eq(parseCookies('note=buy%20milk'), { note: 'buy milk' });
  eq(parseCookies('battery=100%'), { battery: '100%' });
});

test('a value containing = is not truncated', () => {
  eq(parseCookies('token=YWJjZA==; theme=dark'), {
    token: 'YWJjZA==',
    theme: 'dark',
  });
});

test('serializeCookie writes the value plus its attributes, in order', () => {
  eq(serializeCookie('sid', 'abc'), 'sid=abc');
  eq(
    serializeCookie('sid', 'abc', {
      maxAge: 60,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }),
    'sid=abc; Max-Age=60; Path=/; HttpOnly; SameSite=Lax'
  );
  eq(serializeCookie('sid', 'abc', { secure: true }), 'sid=abc; Secure');
});

test('serializeCookie encodes characters that would end the cookie early', () => {
  eq(serializeCookie('note', 'buy milk; now'), 'note=buy%20milk%3B%20now');
  eq(parseCookies(serializeCookie('note', 'buy milk; now')), {
    note: 'buy milk; now',
  });
});

test('a real round trip: Set-Cookie out, Cookie back in', async () => {
  const handler = (req, res) => {
    const jar = parseCookies(req.headers.cookie);
    if (jar.sid) return sendJson(res, 200, { sid: jar.sid, theme: jar.theme ?? null });
    res.setHeader('set-cookie', [
      serializeCookie('sid', 'session 1', { httpOnly: true, path: '/', maxAge: 3600 }),
      serializeCookie('theme', 'dark'),
    ]);
    sendJson(res, 200, { sid: null, theme: null });
  };

  await withServer(handler, async (request) => {
    const first = await request('/');
    const cookies = first.headers.getSetCookie();
    eq(cookies.length, 2);
    ok(cookies[0].includes('HttpOnly'), 'session cookies must be HttpOnly');
    eq(cookies[0], 'sid=session%201; Max-Age=3600; Path=/; HttpOnly');

    const jar = cookies.map((line) => line.split(';')[0]).join('; ');
    const second = await request('/', { headers: { cookie: jar } });
    eq(second.json(), { sid: 'session 1', theme: 'dark' });
  });
});
