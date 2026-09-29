// ─────────────────────────────────────────────────────────────────────────
//  11 · length-prefixed binary records                      ★★★ stretch
//  concepts: Buffer · framing · endianness · partial reads
//  run: node 11-binary-records.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Text formats need a separator character that cannot appear in the data
//  — which is why JSONL must escape newlines. Binary formats solve it the
//  other way: say up front how many bytes come next, then any byte at all
//  is legal payload. That is "framing", and it is how every wire protocol
//  and every real database page works.
//
//  One record on disk:
//
//      [0..4)   uint32 LE   payload byte length (N)
//      [4..8)   uint32 LE   id
//      [8..8+N) payload bytes (utf8)
//
//  Build two things:
//    · encodeRecord({ id, payload })  → a Buffer of 8 + N bytes
//    · decodeRecords(buffer)          → { records, rest }
//
//  `rest` is the trailing bytes that are NOT yet a whole record — a
//  half-arrived frame. Return it as a Buffer (empty when everything
//  decoded cleanly) so the caller can prepend it to the next chunk.
//
//      const buf = Buffer.concat([encodeRecord(a), encodeRecord(b)]);
//      decodeRecords(buf)  → { records: [a, b], rest: <Buffer > }
//
//  hint: Buffer.allocUnsafe(size), buf.writeUInt32LE(value, offset),
//  buf.readUInt32LE(offset), buf.subarray(start, end). Payload length is
//  Buffer.byteLength(payload, 'utf8') — NOT payload.length.

import { test, eq, ok } from '../../_lib/check.js';

export function encodeRecord(record) {
  throw new Error('TODO');
}

export function decodeRecords(buffer) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a record is 8 bytes of header plus the payload', () => {
  const buf = encodeRecord({ id: 1, payload: 'hello' });
  ok(Buffer.isBuffer(buf));
  eq(buf.length, 8 + 5);
});

test('the header holds the length and the id, little-endian', () => {
  const buf = encodeRecord({ id: 258, payload: 'hi' });
  eq(buf.readUInt32LE(0), 2);
  eq(buf.readUInt32LE(4), 258);
  eq([...buf.subarray(4, 8)], [2, 1, 0, 0], 'LE puts the low byte first');
});

test('one record round trips', () => {
  const { records, rest } = decodeRecords(encodeRecord({ id: 7, payload: 'hi' }));
  eq(records, [{ id: 7, payload: 'hi' }]);
  eq(rest.length, 0);
});

test('decodes a stream of concatenated records', () => {
  const buf = Buffer.concat([
    encodeRecord({ id: 1, payload: 'a' }),
    encodeRecord({ id: 2, payload: 'bb' }),
    encodeRecord({ id: 3, payload: '' }),
  ]);
  const { records, rest } = decodeRecords(buf);
  eq(records, [
    { id: 1, payload: 'a' },
    { id: 2, payload: 'bb' },
    { id: 3, payload: '' },
  ]);
  eq(rest.length, 0);
});

test('length is measured in bytes, not characters', () => {
  const buf = encodeRecord({ id: 1, payload: 'héllo 👋' });
  eq(buf.readUInt32LE(0), Buffer.byteLength('héllo 👋', 'utf8'));
  eq(decodeRecords(buf).records, [{ id: 1, payload: 'héllo 👋' }]);
});

test('a half-arrived record is returned as rest, not decoded', () => {
  const whole = Buffer.concat([
    encodeRecord({ id: 1, payload: 'first' }),
    encodeRecord({ id: 2, payload: 'second' }),
  ]);
  const cut = whole.subarray(0, whole.length - 3);
  const { records, rest } = decodeRecords(cut);
  eq(records, [{ id: 1, payload: 'first' }]);
  eq(rest.length, 8 + 6 - 3);
});

test('fewer than 8 bytes cannot even be a header', () => {
  const { records, rest } = decodeRecords(Buffer.from([1, 0, 0]));
  eq(records, []);
  eq(rest.length, 3);
});

test('feeding rest back in with the missing bytes completes the record', () => {
  const whole = Buffer.concat([
    encodeRecord({ id: 1, payload: 'first' }),
    encodeRecord({ id: 2, payload: 'second' }),
  ]);
  const chunk1 = whole.subarray(0, 10);
  const chunk2 = whole.subarray(10);
  const first = decodeRecords(chunk1);
  const second = decodeRecords(Buffer.concat([first.rest, chunk2]));
  eq([...first.records, ...second.records], [
    { id: 1, payload: 'first' },
    { id: 2, payload: 'second' },
  ]);
  eq(second.rest.length, 0);
});
