// ─────────────────────────────────────────────────────────────────────────
//  14 · boss mix                                            ★★★ stretch
//  concepts: unions · guards · keyof generics · DTOs
//  run: node ../run.js exercises/14-boss-mix.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — all of it, in one feature.
//
//  A support console. Events arrive as JSON text, get applied to tickets,
//  and a trimmed view goes back out to the browser.
//
//      IN      parseEvent(json) → Parsed<ConsoleEvent>, guard-checked
//      MIDDLE  apply(tickets, event) → new tickets, exhaustive switch,
//              every write through setField(ticket, key, value)
//      OUT     toRows(tickets) → TicketRow[]: id, subject, assignee,
//              status — readonly, and no comments or closedReason
//
//      parseEvent(EVENT_JSON.unknownType) → error: 'not an event'
//      parseEvent(EVENT_JSON.broken)      → error: 'invalid json'
//
//  No `as` at the boundary: the guard has to earn the type.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Ticket {
  id: string;
  subject: string;
  assignee: string | null;
  comments: string[];
  status: 'open' | 'closed';
  closedReason: string | null;
}

export type ConsoleEvent = TODO;

export type Parsed<T> = TODO;

export type TicketRow = TODO;

export const TICKETS: Ticket[] = [
  {
    id: 't1',
    subject: 'Cannot log in',
    assignee: null,
    comments: [],
    status: 'open',
    closedReason: null,
  },
  {
    id: 't2',
    subject: 'Slow search',
    assignee: 'ada',
    comments: ['looking into it'],
    status: 'open',
    closedReason: null,
  },
];

export const EVENT_JSON = {
  assign: '{"type":"assign","ticketId":"t1","agent":"bo"}',
  comment: '{"type":"comment","ticketId":"t2","body":"any update?"}',
  close: '{"type":"close","ticketId":"t1","reason":"duplicate"}',
  unknownType: '{"type":"archive","ticketId":"t1"}',
  missingField: '{"type":"assign","ticketId":"t1"}',
  broken: '{"type":"assign",',
};

export function isConsoleEvent(value: unknown): TODO {
  throw new Error('TODO');
}

export function parseEvent(json: string): Parsed<ConsoleEvent> {
  throw new Error('TODO');
}

export function setField(ticket: Ticket, key: TODO, value: TODO): Ticket {
  throw new Error('TODO');
}

export function apply(
  tickets: readonly Ticket[],
  event: ConsoleEvent
): Ticket[] {
  throw new Error('TODO');
}

export function toRows(tickets: readonly Ticket[]): TicketRow[] {
  throw new Error('TODO');
}

export function assertNever(value: TODO): TODO {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a well-formed event parses into the union', () => {
  const parsed = parseEvent(EVENT_JSON.assign);
  if (!parsed.ok) throw new Error('expected the ok branch');
  eq(parsed.value, { type: 'assign', ticketId: 't1', agent: 'bo' });
});

test('an unknown type and a missing field are both rejected', () => {
  eq(parseEvent(EVENT_JSON.unknownType), { ok: false, error: 'not an event' });
  eq(parseEvent(EVENT_JSON.missingField), { ok: false, error: 'not an event' });
});

test('unparseable text comes back as data, not an exception', () => {
  eq(parseEvent(EVENT_JSON.broken), { ok: false, error: 'invalid json' });
});

test('assign writes the agent, and an unknown id changes nothing', () => {
  const assigned = apply(TICKETS, {
    type: 'assign',
    ticketId: 't1',
    agent: 'bo',
  });
  eq(assigned[0]!.assignee, 'bo');
  eq(assigned[1]!.assignee, 'ada');
  eq(apply(TICKETS, { type: 'assign', ticketId: 'nope', agent: 'bo' }), TICKETS);
});

test('comment appends without mutating the original', () => {
  const commented = apply(TICKETS, {
    type: 'comment',
    ticketId: 't2',
    body: 'any update?',
  });
  eq(commented[1]!.comments, ['looking into it', 'any update?']);
  eq(TICKETS[1]!.comments, ['looking into it']);
});

test('close sets the status and the reason together', () => {
  const closed = apply(TICKETS, {
    type: 'close',
    ticketId: 't1',
    reason: 'duplicate',
  });
  eq(closed[0]!.status, 'closed');
  eq(closed[0]!.closedReason, 'duplicate');
  eq(closed[1]!.status, 'open');
});

test('rows expose four columns, and an impossible event throws', () => {
  const rows = toRows(TICKETS);
  eq(rows[0], {
    id: 't1',
    subject: 'Cannot log in',
    assignee: null,
    status: 'open',
  });
  const row = rows[1] as Record<string, unknown>;
  ok(!('comments' in row), 'comments must not leave the process');
  ok(!('closedReason' in row));
  throws(
    () =>
      apply(TICKETS, {
        type: 'archive',
        ticketId: 't1',
      } as unknown as ConsoleEvent),
    'unhandled event'
  );
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<ConsoleEvent['type'], 'assign' | 'comment' | 'close'>>;
type _t2 = Expect<Equal<ReturnType<typeof parseEvent>, Parsed<ConsoleEvent>>>;
type _t3 = Expect<
  Equal<Parameters<typeof setField<'status'>>[2], 'open' | 'closed'>
>;
type _t4 = Expect<
  Equal<
    TicketRow,
    {
      readonly id: string;
      readonly subject: string;
      readonly assignee: string | null;
      readonly status: 'open' | 'closed';
    }
  >
>;
type _t5 = Expect<Equal<ReturnType<typeof toRows>, TicketRow[]>>;

function _typeTests() {
  const raw: unknown = JSON.parse(EVENT_JSON.close);

  // @ts-expect-error — unknown until the guard says otherwise
  raw.ticketId;

  if (isConsoleEvent(raw) && raw.type === 'close') {
    const reason: string = raw.reason;
    use(reason);
  }

  const parsed = parseEvent(EVENT_JSON.assign);

  // @ts-expect-error — value only exists on the ok branch
  parsed.value;

  if (parsed.ok) {
    // @ts-expect-error — agent belongs to the assign variant only
    parsed.value.agent;
  }

  const ticket = TICKETS[0]!;

  // @ts-expect-error — status is a two-way literal union
  setField(ticket, 'status', 'done');

  // @ts-expect-error — priority is not a field of Ticket
  setField(ticket, 'priority', 1);

  const row = toRows(TICKETS)[0]!;

  // @ts-expect-error — a row is readonly
  row.status = 'closed';

  // @ts-expect-error — and comments never made it into the row type
  row.comments;

  // @ts-expect-error — 'archive' is not an event
  apply(TICKETS, { type: 'archive', ticketId: 't1' });

  // @ts-expect-error — assertNever takes never, and this is a string
  assertNever('archive');
}
use(_typeTests);
