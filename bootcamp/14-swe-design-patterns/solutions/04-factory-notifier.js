// ─────────────────────────────────────────────────────────────────────────
//  04 · createNotifier — SOLUTION                               ★★☆ core
//  concepts: factory · shared interface · open–closed
//  run: node solutions/04-factory-notifier.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — one call site decides *which* implementation you get, so the
//  caller depends on the interface, not on the constructor.
//  The registry is what makes it open–closed: `createNotifier` is a
//  three-line lookup that never changes again, and a new channel is one
//  `registerNotifier` call — possibly from a different file entirely.
//  A `switch (type)` would work too, but every new channel edits the
//  factory, and everyone who touches that file risks the others.
//  When NOT to use: if there is exactly one implementation and no sign
//  of a second, `new Thing()` is clearer than a factory ceremony.
//  In the wild: `document.createElement(tag)`, Node's
//  `crypto.createHash(alg)`, Winston transports, Passport strategies.

import { test, eq, ok, throws } from '../../_lib/check.js';

const registry = Object.create(null);

export function registerNotifier(type, factory) {
  registry[type] = factory;
}

export function createNotifier(type) {
  const factory = registry[type];
  if (!factory) throw new Error(`unknown notifier type: ${type}`);
  return factory();
}

export function notifierTypes() {
  return Object.keys(registry).sort();
}

registerNotifier('email', () => ({
  type: 'email',
  send: (to, message) => ({ channel: 'email', to, body: message }),
}));

registerNotifier('sms', () => ({
  type: 'sms',
  send: (to, message) => ({ channel: 'sms', to, body: message.slice(0, 140) }),
}));

registerNotifier('slack', () => ({
  type: 'slack',
  send: (to, message) => ({
    channel: 'slack',
    to: to.startsWith('#') ? to : `#${to}`,
    body: message,
  }),
}));

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
