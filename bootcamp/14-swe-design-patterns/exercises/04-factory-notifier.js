// ─────────────────────────────────────────────────────────────────────────
//  04 · createNotifier                                          ★★☆ core
//  concepts: factory · shared interface · open–closed
//  run: node exercises/04-factory-notifier.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The alerting service must not care how a message leaves the building.
//  Build a factory that hands back a notifier for a channel name. Every
//  notifier has the same shape: `{ type, send(to, message) }`, and send
//  returns a delivery record `{ channel, to, body }`.
//
//      createNotifier('email').send('a@b.co', 'hi')
//        → { channel: 'email', to: 'a@b.co', body: 'hi' }
//      createNotifier('sms')    body is cut to 140 characters
//      createNotifier('slack')  to gets a leading '#' if it has none
//      createNotifier('fax')    → throws 'unknown notifier type: fax'
//
//  Then make it open for extension: `registerNotifier(type, factory)`
//  teaches the factory a new channel with no edit to createNotifier —
//  no switch statement to grow. `notifierTypes()` lists what it knows,
//  sorted.
//
//  hint: one module-level registry object, `type → () => notifier`

import { test, eq, ok, throws } from '../../_lib/check.js';

export function registerNotifier(type, factory) {
  throw new Error('TODO');
}

export function createNotifier(type) {
  throw new Error('TODO');
}

export function notifierTypes() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the email notifier sends the body untouched', () => {
  eq(createNotifier('email').send('a@b.co', 'ship it'), {
    channel: 'email',
    to: 'a@b.co',
    body: 'ship it',
  });
});

test('the sms notifier truncates at 140 characters', () => {
  const long = 'x'.repeat(200);
  const record = createNotifier('sms').send('+15550100', long);
  eq(record.channel, 'sms');
  eq(record.body.length, 140);
  eq(createNotifier('sms').send('+15550100', 'short').body, 'short');
});

test('the slack notifier prefixes a bare channel name', () => {
  eq(createNotifier('slack').send('ops', 'deploy done'), {
    channel: 'slack',
    to: '#ops',
    body: 'deploy done',
  });
});

test('the slack notifier leaves an existing # alone', () => {
  eq(createNotifier('slack').send('#ops', 'deploy done').to, '#ops');
});

test('every built-in honours the same interface', () => {
  eq(notifierTypes(), ['email', 'slack', 'sms']);
  for (const type of notifierTypes()) {
    const n = createNotifier(type);
    eq(n.type, type);
    ok(typeof n.send === 'function', `${type} cannot send`);
    eq(n.send('dest', 'body').channel, type);
  }
});

test('an unknown channel is rejected by name', () => {
  createNotifier('email');
  throws(() => createNotifier('fax'), 'unknown notifier type: fax');
});

test('new channels register without editing the factory', () => {
  registerNotifier('push', () => ({
    type: 'push',
    send: (to, message) => ({ channel: 'push', to, body: message.toUpperCase() }),
  }));
  eq(createNotifier('push').send('device-1', 'hi'), {
    channel: 'push',
    to: 'device-1',
    body: 'HI',
  });
  ok(notifierTypes().includes('push'));
});
