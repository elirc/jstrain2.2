// ─────────────────────────────────────────────────────────────────────────
//  29 · template method                                    ★★☆ core
//  concepts: template method · hooks · abstract base
//  run: node 29-template-method.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every report is built the same way — header, body, footer — and only
//  the pieces differ. So write the ORDER once in the base class and leave
//  named holes for subclasses to fill. That shape is the template method.
//
//      class Report {
//        render(rows)  the algorithm: header + body + footer, '\n' joined
//        header()      default: '== title =='
//        body(rows)    abstract: throws 'body() must be implemented'
//        footer(rows)  default: '2 row(s)'
//      }
//
//      new TextReport('Scores').render(rows)
//        → '== Scores ==\n- ada: 90\n- bob: 72\n2 row(s)'
//      new MarkdownReport('Scores').render(rows)
//        → '# Scores\n| ada | 90 |\n| bob | 72 |\n2 row(s)'
//
//  TextReport overrides only body. MarkdownReport overrides header and
//  body and inherits the footer. body() returns an ARRAY of lines, so
//  render can spread it between the two single lines.
//
//  hint: the base body() is the whole abstract-class trick — a method that
//  exists only to throw until somebody overrides it

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── scaffolding: the rows every report renders ───────────────────────────

const rows = [
  { name: 'ada', score: 90 },
  { name: 'bob', score: 72 },
];

export class Report {
  constructor(title) {
    throw new Error('TODO');
  }

  render(source) {
    throw new Error('TODO');
  }

  header() {
    throw new Error('TODO');
  }

  body(source) {
    throw new Error('TODO');
  }

  footer(source) {
    throw new Error('TODO');
  }
}

export class TextReport extends Report {
  body(source) {
    throw new Error('TODO');
  }
}

export class MarkdownReport extends Report {
  header() {
    throw new Error('TODO');
  }

  body(source) {
    throw new Error('TODO');
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
