// ─────────────────────────────────────────────────────────────────────────
//  23 · chat room mediator — SOLUTION                            ★★☆ core
//  concepts: mediator · decoupling peers · central policy
//  run: node solutions/23-mediator-chatroom.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — replace many-to-many references between peers with one
//  object in the middle that every peer talks to instead.
//  Count the wires: N peers holding each other is N² edges and every
//  rule ("mute", "rate limit", "log it") has to be implemented N times.
//  With a mediator it is N edges and every rule is written once, inside
//  `route()`. That is why `mute` here is four lines and touches no
//  participant at all.
//  The handle you hand back is the whole interface a peer gets. Leak the
//  member Map into it and you have rebuilt the mesh with extra steps —
//  hence the test that pins its keys.
//  Mediator vs observer/event bus (exercise 06): a bus is anonymous
//  broadcast — publishers do not know or care who listens, and the bus
//  has no opinion. A mediator KNOWS its participants by name, can
//  address one of them, and holds policy. When "who gets this?" is a
//  decision, it is a mediator; when it is "whoever asked", it is a bus.
//  When NOT to use: two or three collaborators — the middleman is
//  ceremony. And watch the failure mode: a successful mediator attracts
//  rules until it is a god object nobody dares open.
//  In the wild: socket.io rooms, Slack/IRC servers, air-traffic control
//  (the canonical example), Redux store between components, the DOM's
//  event delegation on a container.

import { test, eq, spy, ok } from '../../_lib/check.js';

export function createChatRoom() {
  const members = new Map();
  const muted = new Set();
  const transcript = [];

  // every rule in the room lives here, once
  const route = (message) => {
    if (muted.has(message.from)) {
      return { ok: false, reason: 'muted', delivered: 0 };
    }
    if (message.to !== null && !members.has(message.to)) {
      return {
        ok: false,
        reason: `no such participant: ${message.to}`,
        delivered: 0,
      };
    }

    transcript.push(message);
    let delivered = 0;
    for (const [name, receive] of members) {
      if (name === message.from) continue;
      if (message.to !== null && name !== message.to) continue;
      receive({ ...message });
      delivered += 1;
    }
    return { ok: true, delivered };
  };

  return {
    join(name, receive) {
      members.set(name, receive);
      return {
        name,
        send: (text) => route({ from: name, to: null, text }),
        sendTo: (to, text) => route({ from: name, to, text }),
        leave: () => members.delete(name),
      };
    },
    mute(name) {
      muted.add(name);
      return name;
    },
    history: () => transcript.map((message) => ({ ...message })),
    size: () => members.size,
  };
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
