// ─────────────────────────────────────────────────────────────────────────
//  22 · a tiny JSON API                                      ★★★ stretch
//  concepts: routing by method + path · request bodies · status codes
//  run: node 22-json-api.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Now route on the METHOD as well as the path, and read a request body.
//  State lives in a closure — one Map per createNotesApi() call, so every
//  server starts empty.
//
//      GET    /notes      → 200 {"notes":[{"id":1,"text":"buy milk"}]}
//      POST   /notes      → 201 {"id":1,"text":"buy milk"}
//                           body: {"text":"buy milk"}
//                           bad JSON        → 400 {"error":"invalid json"}
//                           no/blank text  → 400 {"error":"text is required"}
//      GET    /notes/1    → 200 {"id":1,"text":"buy milk"}
//                           unknown id      → 404 {"error":"not found"}
//      DELETE /notes/1    → 204 with an empty body
//                           unknown id      → 404 {"error":"not found"}
//      anything else      → 404 {"error":"not found"}
//
//  Ids start at 1 and count up, never reused. Notes come back from
//  GET /notes in creation order.
//
//  hint: `req` is a readable stream, so the body is
//  `let raw = ''; for await (const chunk of req) raw += chunk;` — and it
//  is async, so the handler you pass to createServer must be async too.
//  Split the pathname on '/' to tell '/notes' from '/notes/1'.

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
  throw new Error('TODO');
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
