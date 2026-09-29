// ─────────────────────────────────────────────────────────────────────────
//  29 · template method — SOLUTION                         ★★☆ core
//  run: node 29-template-method.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: render() never asks what kind of report it is. It calls
//  this.header(), this.body(), this.footer() — and because method lookup
//  starts at the instance and walks up, each call lands on the subclass
//  override if there is one and on the base default if there is not. The
//  base class owns the ALGORITHM, the subclass owns the STEPS. Adding a
//  format touches exactly one new class.
//
//  The abstract hook is just a method that throws. JavaScript has no
//  `abstract` keyword, so `throw new Error('body() must be implemented')`
//  is how a base class says "this hole is mandatory" — and it fires at the
//  call, not at construction, which is why the test renders to see it.
//
//  Returning an array of lines from body() is what keeps render() a
//  one-liner: `[header, ...body, footer].join('\n')` works for zero rows
//  too. The classic wrong turn is putting the '\n' logic in every
//  subclass, at which point the shared piece is no longer shared.

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── scaffolding: the rows every report renders ───────────────────────────

const rows = [
  { name: 'ada', score: 90 },
  { name: 'bob', score: 72 },
];

export class Report {
  constructor(title) {
    this.title = title;
  }

  render(source) {
    return [this.header(), ...this.body(source), this.footer(source)].join('\n');
  }

  header() {
    return `== ${this.title} ==`;
  }

  body(source) {
    throw new Error('body() must be implemented by a subclass');
  }

  footer(source) {
    return `${source.length} row(s)`;
  }
}

export class TextReport extends Report {
  body(source) {
    return source.map((row) => `- ${row.name}: ${row.score}`);
  }
}

export class MarkdownReport extends Report {
  header() {
    return `# ${this.title}`;
  }

  body(source) {
    return source.map((row) => `| ${row.name} | ${row.score} |`);
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the template runs header, body, footer in that order', () => {
  eq(
    new TextReport('Scores').render(rows),
    '== Scores ==\n- ada: 90\n- bob: 72\n2 row(s)'
  );
});

test('a subclass overrides only what differs', () => {
  eq(
    new MarkdownReport('Scores').render(rows),
    '# Scores\n| ada | 90 |\n| bob | 72 |\n2 row(s)'
  );
});

test('the base class is abstract: body has to be filled in', () => {
  throws(() => new Report('Scores').render(rows), 'body() must be implemented');
  eq(new Report('Scores').header(), '== Scores ==', 'the defaults still work');
  eq(new Report('Scores').footer(rows), '2 row(s)');
});

test('render is written once and shared by every report', () => {
  const text = new TextReport('a');
  const md = new MarkdownReport('b');
  ok(text.render === md.render, 'one function, on Report.prototype');
  eq(Object.hasOwn(TextReport.prototype, 'render'), false);
  eq(Object.hasOwn(TextReport.prototype, 'body'), true);
});

test('a new format costs one subclass and no change to render', () => {
  class LoudReport extends Report {
    body(source) {
      return source.map((r) => r.name.toUpperCase());
    }
  }
  eq(new LoudReport('Hey').render(rows), '== Hey ==\nADA\nBOB\n2 row(s)');
});

test('a hook can extend the inherited one with super', () => {
  class TotalledReport extends TextReport {
    footer(source) {
      const total = source.reduce((sum, r) => sum + r.score, 0);
      return `${super.footer(source)} · total ${total}`;
    }
  }
  eq(
    new TotalledReport('Scores').render(rows),
    '== Scores ==\n- ada: 90\n- bob: 72\n2 row(s) · total 162'
  );
});

test('an empty report still gets its header and footer', () => {
  eq(new TextReport('Scores').render([]), '== Scores ==\n0 row(s)');
  eq(new MarkdownReport('Scores').render([]), '# Scores\n0 row(s)');
});
