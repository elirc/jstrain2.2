// ─────────────────────────────────────────────────────────────────────────
//  23 · chat room mediator                                       ★★☆ core
//  concepts: mediator · decoupling peers · central policy
//  run: node exercises/23-mediator-chatroom.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five people in a chat room. If every participant holds a reference to
//  every other participant that is 20 wires, and "mute someone" means
//  editing all five. Put a room in the middle: participants know the
//  room, the room knows everybody, nobody knows anybody.
//
//      const room = createChatRoom();
//      const alice = room.join('alice', onMessage);
//      alice.send('hi')            → { ok: true, delivered: 2 }
//      // bob and carol get { from: 'alice', to: null, text: 'hi' }
//      alice.sendTo('bob', 'psst') → { ok: true, delivered: 1 }
//      alice.sendTo('dave', 'yo')
//        → { ok: false, reason: 'no such participant: dave', delivered: 0 }
//
//  A sender never receives its own message. `room.mute(name)` drops that
//  member's messages — `{ ok: false, reason: 'muted', delivered: 0 }` —
//  and `room.history()` is the transcript of what was actually routed.
//
//  The handle you hand back must be exactly `{ name, send, sendTo,
//  leave }` — no peer list, no room internals.
//
//  hint: one `route(message)` inside the room does delivery AND policy;
//  `send` and `sendTo` are two ways to build the message

import { test, eq, spy, ok } from '../../_lib/check.js';

export function createChatRoom() {
  // -> { join(name, receive), mute(name), history(), size() }
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a broadcast reaches everyone except the sender', () => {
  const room = createChatRoom();
  const heard = { alice: spy(), bob: spy(), carol: spy() };
  const alice = room.join('alice', heard.alice);
  room.join('bob', heard.bob);
  room.join('carol', heard.carol);

  eq(alice.send('hi'), { ok: true, delivered: 2 });
  eq(heard.alice.callCount, 0);
  eq(heard.bob.calls, [[{ from: 'alice', to: null, text: 'hi' }]]);
  eq(heard.carol.calls, [[{ from: 'alice', to: null, text: 'hi' }]]);
});

test('a direct message reaches only its target', () => {
  const room = createChatRoom();
  const bob = spy();
  const carol = spy();
  const alice = room.join('alice', spy());
  room.join('bob', bob);
  room.join('carol', carol);

  eq(alice.sendTo('bob', 'psst'), { ok: true, delivered: 1 });
  eq(bob.calls, [[{ from: 'alice', to: 'bob', text: 'psst' }]]);
  eq(carol.callCount, 0);
});

test('messaging a stranger is reported, not thrown', () => {
  const room = createChatRoom();
  const alice = room.join('alice', spy());
  eq(alice.sendTo('dave', 'yo'), {
    ok: false,
    reason: 'no such participant: dave',
    delivered: 0,
  });
  eq(room.history(), []);
});

test('leaving the room stops delivery', () => {
  const room = createChatRoom();
  const bob = spy();
  const alice = room.join('alice', spy());
  const bobHandle = room.join('bob', bob);
  alice.send('one');
  bobHandle.leave();
  eq(alice.send('two'), { ok: true, delivered: 0 });
  eq(bob.callCount, 1);
  eq(room.size(), 1);
});

test('participants hold no reference to each other', () => {
  const room = createChatRoom();
  const alice = room.join('alice', spy());
  room.join('bob', spy());
  eq(Object.keys(alice).sort(), ['leave', 'name', 'send', 'sendTo']);
  eq(alice.name, 'alice');
});

test('policy lives in the mediator: one mute silences a member', () => {
  const room = createChatRoom();
  const bob = spy();
  const carol = spy();
  const alice = room.join('alice', spy());
  room.join('bob', bob);
  room.join('carol', carol);

  room.mute('alice');
  eq(alice.send('spam'), { ok: false, reason: 'muted', delivered: 0 });
  eq(alice.sendTo('bob', 'spam'), { ok: false, reason: 'muted', delivered: 0 });
  eq(bob.callCount, 0);
  eq(carol.callCount, 0);
});

test('the room keeps the transcript of what it routed', () => {
  const room = createChatRoom();
  const alice = room.join('alice', spy());
  const bob = room.join('bob', spy());
  alice.send('hello');
  bob.sendTo('alice', 'hi back');
  eq(room.history(), [
    { from: 'alice', to: null, text: 'hello' },
    { from: 'bob', to: 'alice', text: 'hi back' },
  ]);
  const stolen = room.history();
  stolen.push({ from: 'mallory', to: null, text: 'forged' });
  ok(room.history().length === 2, 'history() must hand out a copy');
});
