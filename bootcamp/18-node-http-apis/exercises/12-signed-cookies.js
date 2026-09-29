// ─────────────────────────────────────────────────────────────────────────
//  12 · signed cookies                                       ★★★ stretch
//  concepts: HMAC · tamper detection · timing-safe comparison
//  run: node 12-signed-cookies.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A cookie lives on the client's machine, so the client can edit it.
//  `role=user` becomes `role=admin` in one keystroke. Signing does not
//  hide the value — it makes edits detectable.
//
//      signValue('ada', secret)      → 'ada.<hmac in base64url>'
//      unsignValue('ada.<hmac>', secret)          → 'ada'
//      unsignValue('bob.<hmac of ada>', secret)   → null
//      unsignValue('ada.<hmac>', 'other secret')  → null
//      unsignValue('ada', secret)                 → null
//
//  Values are allowed to contain dots ('session.42.v2'); the base64url
//  signature never does. Compare signatures with crypto.timingSafeEqual,
//  which needs equal-length buffers — so check the lengths yourself
//  first and return null when they differ.
//
//  hint: createHmac('sha256', secret).update(value).digest('base64url'),
//  and split the signed string on its LAST dot

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';

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

// Provided: sendJson (01) and the cookie codec from exercise 11.
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

function parseCookies(header) {
  const jar = {};
  for (const part of String(header ?? '').split(';')) {
    const pair = part.trim();
    const at = pair.indexOf('=');
    if (at < 1) continue;
    const name = pair.slice(0, at).trim();
    if (Object.hasOwn(jar, name)) continue;
    try {
      jar[name] = decodeURIComponent(pair.slice(at + 1).trim());
    } catch {
      jar[name] = pair.slice(at + 1).trim();
    }
  }
  return jar;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

export function signValue(value, secret) {
  throw new Error('TODO');
}

export function unsignValue(signed, secret) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const SECRET = 'a-very-secret-key';

test('signing appends a signature after a dot', () => {
  const signed = signValue('ada', SECRET);
  ok(signed.startsWith('ada.'), 'the value stays readable');
  ok(signed.length > 'ada.'.length, 'and a signature follows it');
  eq(signed, signValue('ada', SECRET), 'the same input signs the same way');
});

test('the signature depends on both the value and the secret', () => {
  ok(signValue('ada', SECRET) !== signValue('bob', SECRET));
  ok(signValue('ada', SECRET) !== signValue('ada', 'another-key'));
});

test('unsign returns the original value', () => {
  eq(unsignValue(signValue('ada', SECRET), SECRET), 'ada');
  eq(unsignValue(signValue('user:42', SECRET), SECRET), 'user:42');
});

test('a tampered value is rejected', () => {
  const signed = signValue('role=user', SECRET);
  const forged = signed.replace('role=user', 'role=admin');
  eq(unsignValue(forged, SECRET), null);
});

test('a tampered signature is rejected', () => {
  const signed = signValue('ada', SECRET);
  eq(unsignValue(`${signed}x`, SECRET), null);
  eq(unsignValue(`${signed.slice(0, -1)}`, SECRET), null);
  eq(unsignValue('ada.', SECRET), null);
  eq(unsignValue('ada', SECRET), null);
});

test('the wrong secret is rejected', () => {
  eq(unsignValue(signValue('ada', SECRET), 'wrong-key'), null);
});

test('a value containing dots still round-trips', () => {
  const value = 'session.42.v2';
  eq(unsignValue(signValue(value, SECRET), SECRET), value);
});

test('a real login: signed cookie out, verified cookie back', async () => {
  const handler = (req, res) => {
    const jar = parseCookies(req.headers.cookie);
    if (req.url === '/login') {
      res.setHeader(
        'set-cookie',
        serializeCookie('sid', signValue('ada', SECRET), { httpOnly: true, path: '/' })
      );
      return sendJson(res, 200, { loggedIn: true });
    }
    const user = jar.sid ? unsignValue(jar.sid, SECRET) : null;
    if (user === null) return sendJson(res, 401, { error: 'unauthorized' });
    return sendJson(res, 200, { user });
  };

  await withServer(handler, async (request) => {
    const login = await request('/login');
    const cookie = login.headers.getSetCookie()[0].split(';')[0];

    const me = await request('/me', { headers: { cookie } });
    eq(me.status, 200);
    eq(me.json(), { user: 'ada' });

    const forged = 'sid=' + encodeURIComponent('bob.' + cookie.split('.').pop());
    const attack = await request('/me', { headers: { cookie: forged } });
    eq(attack.status, 401);
    eq(attack.json(), { error: 'unauthorized' });

    eq((await request('/me')).status, 401);
  });
});
