// ─────────────────────────────────────────────────────────────────────────
//  10 · content negotiation — SOLUTION                         ★★☆ core
//  run: node 10-content-negotiation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is `res.format()` in Express and the `accepts`
//  package underneath it. The Accept header is a preference list, not a
//  demand: 'text/html, application/json;q=0.9' means "html if you have
//  it, otherwise json is fine". So the algorithm is: parse into
//  (type, q) pairs, sort by q descending, and walk the client's
//  preferences asking each one "do I offer anything that satisfies
//  this?". The FIRST question is the client's favourite, so the first
//  yes wins.
//  Two traps. The naive version sorts nothing and takes the first entry
//  in the header — which reads 'application/json;q=0.1, text/html' as
//  "json please". And q=0 is not a low priority, it is a refusal;
//  filtering it out is the difference between honouring the header and
//  ignoring it.
//  Wildcards mean the header rarely fails: browsers send '*/*' at the end
//  of the list precisely so a server always has an answer. When nothing
//  fits, 406 Not Acceptable is the correct status — but note it is
//  usually kinder to send your default type anyway, which is why real
//  APIs almost never emit a 406.
//  The HTML renderer here interpolates values straight into markup. That
//  is fine for this exercise and an XSS hole in a real product: anything
//  user-supplied has to be escaped on the way into HTML.

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

// Provided: the three types this exercise knows how to render, in the
// order the server prefers them.
const OFFERED = ['application/json', 'text/plain', 'text/html'];

const RENDERERS = {
  'application/json': (data) => JSON.stringify(data),
  'text/plain': (data) =>
    Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n'),
  'text/html': (data) =>
    `<ul>${Object.entries(data)
      .map(([key, value]) => `<li>${key}: ${value}</li>`)
      .join('')}</ul>`,
};

export function chooseType(accept, offered) {
  const header = String(accept ?? '').trim();
  if (header === '') return offered[0] ?? null;

  const wanted = header
    .split(',')
    .map((part) => {
      const [type, ...params] = part.split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { type: type.trim().toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((entry) => entry.type !== '' && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const entry of wanted) {
    const hit = offered.find((candidate) => typeMatches(entry.type, candidate));
    if (hit) return hit;
  }
  return null;
}

function typeMatches(pattern, type) {
  if (pattern === '*/*' || pattern === type) return true;
  const group = pattern.slice(0, pattern.indexOf('/'));
  return pattern.endsWith('/*') && type.startsWith(`${group}/`);
}

export function render(res, status, data, accept) {
  const type = chooseType(accept, OFFERED);
  if (type === null) {
    const body = Buffer.from(JSON.stringify({ error: 'not acceptable' }), 'utf8');
    res.writeHead(406, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': String(body.length),
    });
    res.end(body);
    return;
  }

  const body = Buffer.from(RENDERERS[type](data), 'utf8');
  res.writeHead(status, {
    'content-type': `${type}; charset=utf-8`,
    'content-length': String(body.length),
    vary: 'Accept',
  });
  res.end(body);
}

// ──────────────────────────── tests ──────────────────────────────────────

const note = { id: 1, text: 'buy milk' };
const handler = (req, res) => render(res, 200, note, req.headers.accept);

test('no Accept header means "you choose" — the first type offered', () => {
  eq(chooseType('', OFFERED), 'application/json');
  eq(chooseType(undefined, OFFERED), 'application/json');
});

test('an exact match wins even when it is not the server default', () => {
  eq(chooseType('text/html', OFFERED), 'text/html');
  eq(chooseType('text/plain', OFFERED), 'text/plain');
});

test('the highest q wins, not the first one listed', () => {
  eq(chooseType('application/json;q=0.2, text/html;q=0.9', OFFERED), 'text/html');
  eq(chooseType('text/html;q=0.1, application/json', OFFERED), 'application/json');
});

test('q=0 is a refusal, not a low priority', () => {
  eq(chooseType('text/html;q=0, text/plain', OFFERED), 'text/plain');
});

test('wildcards match: */* takes the default, text/* takes a text type', () => {
  eq(chooseType('*/*', OFFERED), 'application/json');
  eq(chooseType('text/*', OFFERED), 'text/plain');
  eq(chooseType('text/html, */*;q=0.1', OFFERED), 'text/html');
});

test('nothing on offer is acceptable → null', () => {
  eq(chooseType('image/png', OFFERED), null);
  eq(chooseType('image/png, image/jpeg;q=0.5', OFFERED), null);
});

test('render answers JSON by default and html when asked', async () => {
  await withServer(handler, async (request) => {
    const json = await request('/notes/1', { headers: { accept: '*/*' } });
    eq(json.headers.get('content-type'), 'application/json; charset=utf-8');
    eq(json.json(), note);

    const html = await request('/notes/1', { headers: { accept: 'text/html' } });
    ok(html.headers.get('content-type').startsWith('text/html'));
    eq(html.body, '<ul><li>id: 1</li><li>text: buy milk</li></ul>');
  });
});

test('an impossible Accept is a 406, and Vary tells caches why', async () => {
  await withServer(handler, async (request) => {
    const plain = await request('/notes/1', { headers: { accept: 'text/plain' } });
    eq(plain.body, 'id: 1\ntext: buy milk');
    eq(plain.headers.get('vary'), 'Accept');

    const nope = await request('/notes/1', { headers: { accept: 'image/png' } });
    eq(nope.status, 406);
    eq(nope.json(), { error: 'not acceptable' });
  });
});
