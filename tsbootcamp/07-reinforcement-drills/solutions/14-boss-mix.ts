// ─────────────────────────────────────────────────────────────────────────
//  14 · boss mix — SOLUTION                                 ★★★ stretch
//  run: node ../run.js solutions/14-boss-mix.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is the whole module in one flow, and the shape of it
//  is the shape of most features you will ever type.
//
//  IN — text arrives, so it is `unknown` until a guard says otherwise.
//  `isConsoleEvent` earns the predicate field by field, including the
//  discriminant: checking `type` against the three literals is what makes
//  the union a union rather than "an object with a type property".
//
//  MIDDLE — `apply` switches on that discriminant, so each branch sees its
//  own payload, and the `default` proves exhaustiveness through
//  assertNever. Updates go through `setField<K extends keyof Ticket>`,
//  which ties `value: Ticket[K]` to the key: `setField(t, 'status',
//  'closed')` type-checks and `setField(t, 'status', 'done')` does not.
//  Nothing mutates — every branch returns a new list.
//
//  OUT — `TicketRow` is a Pick wrapped in Readonly: an allow-list for what
//  leaves the process, and immutable for the consumer. `comments` and
//  `closedReason` are absent from the TYPE, which is why the runtime test
//  can assert they are absent from the OBJECT and both statements mean the
//  same thing.
//
//  The one thing worth copying wholesale: the guard is the only place
//  where `unknown` becomes `ConsoleEvent`, and it gets there on `typeof`
//  and `in` alone — no cast. The single `as` in the file is the
//  computed-key spread inside setField (same one as 07), and it is about
//  object literals, not about trusting data.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Ticket {
  id: string;
  subject: string;
  assignee: string | null;
  comments: string[];
  status: 'open' | 'closed';
  closedReason: string | null;
}

export type ConsoleEvent =
  | { type: 'assign'; ticketId: string; agent: string }
  | { type: 'comment'; ticketId: string; body: string }
  | { type: 'close'; ticketId: string; reason: string };

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type TicketRow = Readonly<
  Pick<Ticket, 'id' | 'subject' | 'assignee' | 'status'>
>;

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

export function isConsoleEvent(value: unknown): value is ConsoleEvent {
  if (typeof value !== 'object' || value === null) return false;
  if (!('ticketId' in value) || typeof value.ticketId !== 'string') return false;
  if (!('type' in value)) return false;
  switch (value.type) {
    case 'assign':
      return 'agent' in value && typeof value.agent === 'string';
    case 'comment':
      return 'body' in value && typeof value.body === 'string';
    case 'close':
      return 'reason' in value && typeof value.reason === 'string';
    default:
      return false;
  }
}

export function parseEvent(json: string): Parsed<ConsoleEvent> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'invalid json' };
  }
  return isConsoleEvent(data)
    ? { ok: true, value: data }
    : { ok: false, error: 'not an event' };
}

export function setField<K extends keyof Ticket>(
  ticket: Ticket,
  key: K,
  value: Ticket[K]
): Ticket {
  return { ...ticket, [key]: value } as Ticket;
}

export function apply(
  tickets: readonly Ticket[],
  event: ConsoleEvent
): Ticket[] {
  return tickets.map((ticket) => {
    if (ticket.id !== event.ticketId) return ticket;
    switch (event.type) {
      case 'assign':
        return setField(ticket, 'assignee', event.agent);
      case 'comment':
        return setField(ticket, 'comments', [...ticket.comments, event.body]);
      case 'close':
        return setField(
          setField(ticket, 'status', 'closed'),
          'closedReason',
          event.reason
        );
      default:
        return assertNever(event);
    }
  });
}

export function toRows(tickets: readonly Ticket[]): TicketRow[] {
  return tickets.map(({ id, subject, assignee, status }) => ({
    id,
    subject,
    assignee,
    status,
  }));
}

export function assertNever(value: never): never {
  throw new Error(`unhandled event: ${JSON.stringify(value)}`);
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
