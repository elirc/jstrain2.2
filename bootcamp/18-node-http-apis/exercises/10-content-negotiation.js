// ─────────────────────────────────────────────────────────────────────────
//  10 · content negotiation                                     ★★☆ core
//  concepts: Accept header · q-values · Vary
//  run: node 10-content-negotiation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The same resource, three representations. The client says what it can
//  read in the Accept header; the server picks from what it can write.
//
//      chooseType('text/html', OFFERED)               → 'text/html'
//      chooseType('', OFFERED)                        → OFFERED[0]
//      chooseType('application/json;q=0.2, text/html;q=0.9', OFFERED)
//                                                     → 'text/html'
//      chooseType('text/*', OFFERED)                  → 'text/plain'
//      chooseType('image/png', OFFERED)               → null
//
//  Then render(res, status, data, accept):
//    · picks a type from OFFERED, renders `data` with RENDERERS[type]
//    · sets content-type '<type>; charset=utf-8', content-length, and
//      `vary: Accept` (caches must not serve the html to a json client)
//    · nothing acceptable → 406 { error: 'not acceptable' } as JSON
//
//  hint: 'a/b;q=0.9' — split on ',' then on ';', sort by q descending,
//  and remember that q=0 means "do not send me this"

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
  throw new Error('TODO');
}

export function render(res, status, data, accept) {
  throw new Error('TODO');
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
