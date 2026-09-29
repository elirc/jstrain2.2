// ─────────────────────────────────────────────────────────────────────────
//  02 · the comment that runs code — SOLUTION                ★★☆ core
//  concepts: security · XSS · output encoding
//  run: node 02-html-escaping.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: stored XSS. User text was concatenated into an HTML
//  string, so a posted `<script>` became a real <script> tag in every
//  reader's page. Same shape as file 01's injection — untrusted input
//  crossing into a language (here HTML) without encoding.
//  The tell: a template that drops a user value between tags with no
//  escaping in sight. The fix is not to sanitize the INPUT (you'd have
//  to guess every context); it is to ENCODE at OUTPUT, for the context
//  you're writing into.
//  The minimal fix: escape every user field as you interpolate it —
//      const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({
//        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
//      })[ch]);
//      return `<li><b>${esc(author)}</b>: ${esc(body)}</li>`;
//  Escape `&` FIRST or you double-encode the others. The <li>/<b> you
//  wrote stays literal — only the untrusted parts are encoded.
//  In the wild: innerHTML with user data, dangerouslySetInnerHTML,
//  building emails or PDFs by string concat. Real apps lean on the
//  framework's auto-escaping (React text nodes, template engines) and
//  encode by context — HTML body vs attribute vs URL vs JS each differ.

import { test, eq, ok } from '../../_lib/check.js';

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );

export function renderComment({ author, body }) {
  return `<li><b>${esc(author)}</b>: ${esc(body)}</li>`;
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
