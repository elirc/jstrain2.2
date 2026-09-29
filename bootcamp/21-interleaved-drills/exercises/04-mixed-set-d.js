// ─────────────────────────────────────────────────────────────────────────
//  04 · mixed set D                                        ★★☆ core
//  concepts: mixed — work out which tool each job wants
//  run: node 04-mixed-set-d.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five jobs inside a podcast app. No hints. One sitting.
//
//    playerSettings({ volume: 0, autoplay: false })
//      → { speed: 1, volume: 0, autoplay: false, skipIntroSec: 0 }
//      defaults: speed 1 · volume 0.8 · autoplay true · skipIntroSec 0
//    const t = makeEpisodeTimer('Ep 12');
//    const { tick, label } = t;         ← torn off the object
//    tick(30); tick(15); label()        → 'Ep 12 @ 45s'
//    construct(Host, ['Ada'])           → what `new Host('Ada')` builds,
//                                         written without the `new` word
//    await loadEpisodes([1, 2, 3], fetchOne) → ['ep-1', 'ep-2', 'ep-3']
//    const ix = makeShowIndex(SHOWS);
//    ix.idFor('deep-dive') → 's2';   ix.slugFor('s2') → 'deep-dive'

import { test, eq, ok } from '../../_lib/check.js';

const SHOWS = [
  { id: 's1', slug: 'morning-brief', title: 'Morning Brief' },
  { id: 's2', slug: 'deep-dive', title: 'Deep Dive' },
  { id: 's3', slug: 'off-topic', title: 'Off Topic' },
];

function Host(name) {
  this.name = name;
  this.shows = [];
}
Host.prototype.greet = function () {
  return `hi from ${this.name}`;
};

function Swapped() {
  this.ignored = true;
  return { swapped: true };
}

export function playerSettings(saved) {
  throw new Error('TODO');
}

export function makeEpisodeTimer(title) {
  throw new Error('TODO');
}

export function construct(Ctor, args) {
  throw new Error('TODO');
}

export async function loadEpisodes(ids, fetchOne) {
  throw new Error('TODO');
}

export function makeShowIndex(shows) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('saved zeros and falses beat the defaults', () => {
  eq(playerSettings({ volume: 0, autoplay: false, skipIntroSec: 45 }), {
    speed: 1,
    volume: 0,
    autoplay: false,
    skipIntroSec: 45,
  });
});

test('missing keys — and a missing object — fall back', () => {
  const defaults = { speed: 1, volume: 0.8, autoplay: true, skipIntroSec: 0 };
  eq(playerSettings({}), defaults);
  eq(playerSettings(), defaults);
  eq(playerSettings({ speed: undefined }), defaults);
});

test('the timer keeps working after its methods are pulled apart', () => {
  const { tick, label } = makeEpisodeTimer('Ep 12');
  tick(30);
  tick(15);
  eq(label(), 'Ep 12 @ 45s');
});

test('building an instance by hand links the prototype', () => {
  const host = construct(Host, ['Ada']);
  ok(host instanceof Host);
  eq(host.name, 'Ada');
  eq(host.shows, []);
  eq(host.greet(), 'hi from Ada');
});

test('a constructor that returns an object wins', () => {
  eq(construct(Swapped, []), { swapped: true });
});

test('every episode is awaited, and results keep input order', async () => {
  const fetchOne = (id) =>
    new Promise((resolve) => setTimeout(() => resolve(`ep-${id}`), (4 - id) * 6));
  eq(await loadEpisodes([1, 2, 3], fetchOne), ['ep-1', 'ep-2', 'ep-3']);
  eq(await loadEpisodes([], fetchOne), []);
});

test('the index answers in both directions, and misses cleanly', () => {
  const ix = makeShowIndex(SHOWS);
  eq(ix.idFor('deep-dive'), 's2');
  eq(ix.slugFor('s2'), 'deep-dive');
  eq(ix.idFor('no-such-show'), undefined);
  eq(ix.slugFor('toString'), undefined);
});
