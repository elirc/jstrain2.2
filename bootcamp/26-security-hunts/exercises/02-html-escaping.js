// ─────────────────────────────────────────────────────────────────────────
//  02 · the comment that runs code                           ★★☆ core
//  concepts: security · XSS · output encoding
//  run: node 02-html-escaping.js
// ─────────────────────────────────────────────────────────────────────────
//
//  renderComment({ author, body }) builds the HTML string for one posted
//  comment. Whatever a user typed is TEXT and must render as text, even
//  when it looks like markup:
//
//      renderComment({ author: 'Ada', body: 'hi <3' })
//        → '<li><b>Ada</b>: hi &lt;3</li>'
//
//  A user posted a comment containing a <script> tag, and it executed in
//  every reader's browser.
//
//  The code below is fully written — and a security hole. 2 tests fail:
//  they post markup as a comment. Find the flaw and fix it with the
//  smallest change. Don't change the tag structure the tests expect.
//
//  hint: the author and body come from users; the <li>/<b> wrapper comes
//  from you. Which parts must survive as literal characters, and where
//  in this function does that conversion happen — if it happens at all?

import { test, eq, ok } from '../../_lib/check.js';

export function renderComment({ author, body }) {
  return `<li><b>${author}</b>: ${body}</li>`;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a plain comment renders as-is', () => {
  eq(
    renderComment({ author: 'Ada', body: 'nice post' }),
    '<li><b>Ada</b>: nice post</li>'
  );
});

test('angle brackets in the body are escaped to entities', () => {
  eq(
    renderComment({ author: 'Ada', body: 'hi <3' }),
    '<li><b>Ada</b>: hi &lt;3</li>'
  );
});

test('a script tag in the body cannot survive as a tag', () => {
  const html = renderComment({ author: 'Mallory', body: '<script>steal()</script>' });
  ok(!html.includes('<script>'), 'the literal <script> tag must not appear');
  ok(html.includes('&lt;script&gt;'), 'it must be escaped instead');
});

test('a hostile author name is escaped too', () => {
  const html = renderComment({ author: '<img src=x onerror=hack>', body: 'hi' });
  ok(!html.includes('<img'), 'the author is user input as well');
});
