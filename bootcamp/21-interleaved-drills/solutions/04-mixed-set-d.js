// ─────────────────────────────────────────────────────────────────────────
//  04 · mixed set D — SOLUTION                             ★★☆ core
//  run: node 04-mixed-set-d.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — five tools, one per job:
//  1. Spread the defaults, then spread the saved settings over them —
//     but only after stripping the `undefined` values, because spread
//     happily copies an explicit `undefined` on top of a good default.
//     Per-key `??` says the same thing and is the version that reads.
//  2. Nothing here uses `this`. A factory closing over `elapsed` hands
//     back arrow methods that cannot lose a receiver they never had —
//     the cheapest fix for "my method broke when I passed it as a
//     callback".
//  3. What `new` does, in four steps: make an object whose prototype is
//     `Ctor.prototype`, call `Ctor` with it as `this`, and return the
//     constructor's result if it happens to be an object — otherwise the
//     object you made.
//  4. `forEach(async …)` starts every callback and ignores every promise,
//     so the function returns before the first fetch lands. `map` +
//     `Promise.all` keeps the parallelism AND the input order.
//  5. Two-way lookup = two Maps built in one pass. A Map also keeps
//     `toString` from ever answering a lookup.

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

const PLAYER_DEFAULTS = {
  speed: 1,
  volume: 0.8,
  autoplay: true,
  skipIntroSec: 0,
};

export function playerSettings(saved) {
  const settings = {};
  for (const key of Object.keys(PLAYER_DEFAULTS)) {
    settings[key] = saved?.[key] ?? PLAYER_DEFAULTS[key];
  }
  return settings;
}

export function makeEpisodeTimer(title) {
  let elapsed = 0;
  return {
    tick: (seconds) => (elapsed += seconds),
    label: () => `${title} @ ${elapsed}s`,
  };
}

export function construct(Ctor, args) {
  const instance = Object.create(Ctor.prototype);
  const returned = Ctor.apply(instance, args);
  return returned !== null && typeof returned === 'object'
    ? returned
    : instance;
}

export async function loadEpisodes(ids, fetchOne) {
  return Promise.all(ids.map((id) => fetchOne(id)));
}

export function makeShowIndex(shows) {
  const idBySlug = new Map();
  const slugById = new Map();
  for (const show of shows) {
    idBySlug.set(show.slug, show.id);
    slugById.set(show.id, show.slug);
  }
  return {
    idFor: (slug) => idBySlug.get(slug),
    slugFor: (id) => slugById.get(id),
  };
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
