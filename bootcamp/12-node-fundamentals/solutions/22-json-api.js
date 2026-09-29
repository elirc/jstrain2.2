// ─────────────────────────────────────────────────────────────────────────
//  22 · a tiny JSON API — SOLUTION                           ★★★ stretch
//  run: node 22-json-api.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape of every router ever written — normalise the
//  request into (method, pathSegments), then match. Splitting the
//  pathname and dropping empty segments makes '/notes' and '/notes/'
//  identical and hands you the id as segments[1].
//  Bodies are streams, so reading one is async — which is why the whole
//  handler is an async function. JSON.parse goes inside its own try/catch
//  so that a malformed body is a 400 (the client's fault) instead of an
//  exception in the handler, which would leave the request hanging and
//  the client waiting for a response that never comes.
//  Validate before mutating: the id counter must not advance for a
//  request that gets rejected.
//  204 means "done, nothing to say", so it must carry no body — writing
//  one is a protocol error, and fetch will show it as an empty string.
//  The Map and the counter live in the closure, so two servers never
//  share state and the tests cannot leak into each other.

import { test, eq, ok } from '../../_lib/check.js';
import http from 'node:http';

// Provided: start the server on a free loopback port, run the test
// against it, then shut it down no matter what happened.
async function withServer(server, run) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await run(server.address().port, server);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

// Provided: POST a raw string body to /notes.
function postNote(port, rawBody) {
  return fetch(`http://127.0.0.1:${port}/notes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: rawBody,
  });
}

export function createNotesApi() {
  const notes = new Map();
  let nextId = 1;

  return http.createServer(async (req, res) => {
    const send = (status, body) => {
      if (body === undefined) {
        res.writeHead(status);
        res.end();
        return;
      }
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    const url = new URL(req.url, 'http://127.0.0.1');
    const segments = url.pathname.split('/').filter(Boolean);
    const isCollection = segments.length === 1 && segments[0] === 'notes';
    const isItem = segments.length === 2 && segments[0] === 'notes';
    const id = isItem ? Number(segments[1]) : null;

    if (isCollection && req.method === 'GET') {
      return send(200, { notes: [...notes.values()] });
    }

    if (isCollection && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) raw += chunk;

      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return send(400, { error: 'invalid json' });
      }

      const text = body?.text;
      if (typeof text !== 'string' || text === '') {
        return send(400, { error: 'text is required' });
      }

      const note = { id: nextId, text };
      nextId += 1;
      notes.set(note.id, note);
      return send(201, note);
    }

    if (isItem && req.method === 'GET') {
      const note = notes.get(id);
      return note ? send(200, note) : send(404, { error: 'not found' });
    }

    if (isItem && req.method === 'DELETE') {
      if (!notes.has(id)) return send(404, { error: 'not found' });
      notes.delete(id);
      return send(204);
    }

    return send(404, { error: 'not found' });
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a fresh api has no notes', async () => {
  await withServer(createNotesApi(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/notes`);
    eq(res.status, 200);
    eq(await res.json(), { notes: [] });
  });
});

test('POST /notes creates a note with id 1 and status 201', async () => {
  await withServer(createNotesApi(), async (port) => {
    const res = await postNote(port, JSON.stringify({ text: 'buy milk' }));
    eq(res.status, 201);
    eq(await res.json(), { id: 1, text: 'buy milk' });
  });
});

test('created notes show up in the list, in order', async () => {
  await withServer(createNotesApi(), async (port) => {
    await postNote(port, JSON.stringify({ text: 'first' }));
    await postNote(port, JSON.stringify({ text: 'second' }));
    const res = await fetch(`http://127.0.0.1:${port}/notes`);
    eq(await res.json(), {
      notes: [
        { id: 1, text: 'first' },
        { id: 2, text: 'second' },
      ],
    });
  });
});

test('GET /notes/:id finds one note and 404s on the rest', async () => {
  await withServer(createNotesApi(), async (port) => {
    await postNote(port, JSON.stringify({ text: 'buy milk' }));
    const hit = await fetch(`http://127.0.0.1:${port}/notes/1`);
    eq(hit.status, 200);
    eq(await hit.json(), { id: 1, text: 'buy milk' });

    const miss = await fetch(`http://127.0.0.1:${port}/notes/99`);
    eq(miss.status, 404);
    eq(await miss.json(), { error: 'not found' });
  });
});

test('DELETE /notes/:id answers 204 and removes the note', async () => {
  await withServer(createNotesApi(), async (port) => {
    await postNote(port, JSON.stringify({ text: 'buy milk' }));
    const gone = await fetch(`http://127.0.0.1:${port}/notes/1`, { method: 'DELETE' });
    eq(gone.status, 204);
    eq(await gone.text(), '');

    const list = await fetch(`http://127.0.0.1:${port}/notes`);
    eq(await list.json(), { notes: [] });
  });
});

test('a body that is not JSON is a 400', async () => {
  await withServer(createNotesApi(), async (port) => {
    const res = await postNote(port, '{ not json');
    eq(res.status, 400);
    eq(await res.json(), { error: 'invalid json' });
  });
});

test('a note without text is a 400', async () => {
  await withServer(createNotesApi(), async (port) => {
    const res = await postNote(port, JSON.stringify({ note: 'wrong field' }));
    eq(res.status, 400);
    eq(await res.json(), { error: 'text is required' });
  });
});

test('the right path with the wrong method is a 404', async () => {
  await withServer(createNotesApi(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/notes`, { method: 'PUT' });
    eq(res.status, 404);
    ok(typeof (await res.json()).error === 'string');
  });
});
