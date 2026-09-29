// ─────────────────────────────────────────────────────────────────────────
//  20 · mini-express                                         ★★★ stretch
//  concepts: everything in this module, assembled
//  run: node 20-mini-express.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The finale: put the pieces together into one small framework, then run
//  a real notes API on it.
//
//      const app = createApp();
//      app.use(logger);                 // middleware, in order (05)
//      app.use(jsonBody());             // provided below (09)
//      app.get('/notes/:id', handler);  // routes with params (03, 04)
//      const server = app.listen(0, '127.0.0.1');   // → an http.Server
//
//  What createApp() owes you:
//    · use(fn) / get / post / delete, each returning the app
//    · handler(req, res): sets req.path, runs the middleware in order,
//      then the routes
//    · routing: method + pattern, with req.params filled in
//        - no route claims the path            → 404 { error: 'not found' }
//        - the path exists, the method does not → 405 { error: 'method
//          not allowed' } + an Allow header, sorted and comma-separated
//    · errors: a handler that throws or rejects, or calls next(err),
//      answers 500 { error: 'internal server error' } — never the
//      message, never the stack (07)
//    · listen(port, host, callback?) creates the server, starts it and
//      RETURNS it, so the caller can close it again
//
//  hint: routing is not special — make it the last middleware in the
//  chain and the 404 is just "the chain ran out"

import { test, eq, ok, spy } from '../../_lib/check.js';
import http from 'node:http';
import { once } from 'node:events';

// Provided: sendJson (01), pathOf (02), matchPath (04) and readJson (09).
function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
  });
  res.end(body);
}

function pathOf(req) {
  const url = new URL(req.url, 'http://internal.invalid');
  return url.pathname.replace(/\/+$/, '') || '/';
}

function matchPath(pattern, pathname) {
  const wanted = pattern.split('/').filter(Boolean);
  const actual = pathname.split('/').filter(Boolean);
  if (wanted.length !== actual.length) return null;
  const params = {};
  for (let i = 0; i < wanted.length; i += 1) {
    const segment = wanted[i];
    if (segment.startsWith(':')) params[segment.slice(1)] = decodeURIComponent(actual[i]);
    else if (segment !== actual[i]) return null;
  }
  return params;
}

// The body parser from exercise 09, ready to app.use().
function jsonBody(options = {}) {
  const limit = options.limit ?? 1024;
  return async (req, res, next) => {
    const type = req.headers['content-type'] ?? '';
    if (!type.toLowerCase().startsWith('application/json')) return next();

    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit) return sendJson(res, 413, { error: 'payload too large' });
      chunks.push(chunk);
    }

    try {
      req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return sendJson(res, 400, { error: 'invalid json' });
    }
    next();
  };
}

export function createApp() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// The demo application: notes CRUD, assembled out of this module.
function notesApp(log = () => {}) {
  const notes = new Map();
  let nextId = 1;

  const app = createApp();

  app.use((req, res, next) => {
    log(`${req.method} ${req.path}`);
    next();
  });
  app.use(jsonBody({ limit: 1024 }));

  app.get('/notes', (req, res) => sendJson(res, 200, { notes: [...notes.values()] }));

  app.post('/notes', (req, res) => {
    const text = req.body?.text;
    if (typeof text !== 'string' || text === '') {
      return sendJson(res, 400, { error: 'text is required' });
    }
    const note = { id: nextId, text };
    nextId += 1;
    notes.set(String(note.id), note);
    res.setHeader('location', `/notes/${note.id}`);
    sendJson(res, 201, note);
  });

  app.get('/notes/:id', (req, res) => {
    const note = notes.get(req.params.id);
    return note ? sendJson(res, 200, note) : sendJson(res, 404, { error: 'not found' });
  });

  app.delete('/notes/:id', (req, res) => {
    if (!notes.delete(req.params.id)) return sendJson(res, 404, { error: 'not found' });
    res.writeHead(204);
    res.end();
  });

  app.get('/boom', async () => {
    await Promise.resolve();
    throw new Error('the database is on fire (secret connection string)');
  });

  return app;
}

// Provided: start an app on an ephemeral loopback port and talk to it.
async function withApp(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, init) => {
    const res = await fetch(base + path, init);
    const body = await res.text();
    return {
      status: res.status,
      headers: res.headers,
      body,
      json: () => JSON.parse(body),
    };
  };
  try {
    return await run(request, server);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

const asJson = (value) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: typeof value === 'string' ? value : JSON.stringify(value),
});

test('listen gives back a real server on an ephemeral loopback port', async () => {
  await withApp(notesApp(), async (request, server) => {
    eq(server.address().address, '127.0.0.1');
    ok(server.address().port > 0);
    eq((await request('/notes')).status, 200);
  });
});

test('a path nobody registered is a JSON 404', async () => {
  await withApp(notesApp(), async (request) => {
    const res = await request('/nope');
    eq(res.status, 404);
    eq(res.json(), { error: 'not found' });
  });
});

test('middleware runs for every request, before the routes', async () => {
  const log = spy();
  await withApp(notesApp(log), async (request) => {
    await request('/notes');
    await request('/nope');
    eq(log.callCount, 2);
    eq(log.calls[0][0], 'GET /notes');
    eq(log.calls[1][0], 'GET /nope');
  });
});

test('POST /notes creates a note and GET /notes lists it', async () => {
  await withApp(notesApp(), async (request) => {
    eq((await request('/notes')).json(), { notes: [] });

    const created = await request('/notes', asJson({ text: 'buy milk' }));
    eq(created.status, 201);
    eq(created.json(), { id: 1, text: 'buy milk' });
    eq(created.headers.get('location'), '/notes/1');

    await request('/notes', asJson({ text: 'walk the dog' }));
    eq((await request('/notes')).json(), {
      notes: [
        { id: 1, text: 'buy milk' },
        { id: 2, text: 'walk the dog' },
      ],
    });
  });
});

test('GET /notes/:id finds one note, or 404s', async () => {
  await withApp(notesApp(), async (request) => {
    await request('/notes', asJson({ text: 'buy milk' }));
    eq((await request('/notes/1')).json(), { id: 1, text: 'buy milk' });

    const missing = await request('/notes/99');
    eq(missing.status, 404);
    eq(missing.json(), { error: 'not found' });
  });
});

test('DELETE /notes/:id answers 204 and the note is gone', async () => {
  await withApp(notesApp(), async (request) => {
    await request('/notes', asJson({ text: 'buy milk' }));

    const gone = await request('/notes/1', { method: 'DELETE' });
    eq(gone.status, 204);
    eq(gone.body, '');

    eq((await request('/notes/1')).status, 404);
    eq((await request('/notes')).json(), { notes: [] });
  });
});

test('bad input is a 400, and the wrong verb is a 405 with Allow', async () => {
  await withApp(notesApp(), async (request) => {
    const broken = await request('/notes', asJson('{ not json'));
    eq(broken.status, 400);
    eq(broken.json(), { error: 'invalid json' });

    const empty = await request('/notes', asJson({ note: 'wrong field' }));
    eq(empty.status, 400);
    eq(empty.json(), { error: 'text is required' });

    const wrongVerb = await request('/notes', { method: 'PUT' });
    eq(wrongVerb.status, 405);
    eq(wrongVerb.headers.get('allow'), 'GET, POST');
  });
});

test('a handler that throws is a 500 that leaks nothing', async () => {
  const log = spy();
  await withApp(notesApp(log), async (request) => {
    const res = await request('/boom');
    eq(res.status, 500);
    eq(res.json(), { error: 'internal server error' });
    ok(!res.body.includes('connection string'));

    eq((await request('/notes')).status, 200, 'the server is still up');
  });
});
