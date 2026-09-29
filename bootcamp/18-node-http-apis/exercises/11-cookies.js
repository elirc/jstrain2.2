// ─────────────────────────────────────────────────────────────────────────
//  11 · cookies                                                 ★★☆ core
//  concepts: Cookie vs Set-Cookie · encoding · attributes
//  run: node 11-cookies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two headers, two grammars. Requests carry `Cookie: a=1; b=2` — pairs
//  only, no attributes. Responses carry one `Set-Cookie` per cookie, with
//  the attributes attached. Build both halves.
//
//      parseCookies('sid=abc; theme=dark') → { sid: 'abc', theme: 'dark' }
//      parseCookies(undefined)             → {}
//      parseCookies('note=buy%20milk')     → { note: 'buy milk' }
//
//      serializeCookie('sid', 'abc')       → 'sid=abc'
//      serializeCookie('sid', 'abc', { maxAge: 60, path: '/',
//                                      httpOnly: true, sameSite: 'Lax' })
//          → 'sid=abc; Max-Age=60; Path=/; HttpOnly; SameSite=Lax'
//
//  Attribute order: Max-Age, Path, Domain, HttpOnly, Secure, SameSite.
//  Encode values on the way out, decode on the way in, and skip pairs
//  that make no sense instead of throwing.
//
//  hint: split each pair on the FIRST '=' — base64 values end in '='

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
  throw new Error('TODO');
}

export function serializeCookie(name, value, options = {}) {
  throw new Error('TODO');
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
