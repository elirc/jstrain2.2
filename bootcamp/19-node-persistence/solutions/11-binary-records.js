// ─────────────────────────────────────────────────────────────────────────
//  11 · length-prefixed binary records — SOLUTION            ★★★ stretch
//  run: node 11-binary-records.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a length prefix removes the need for an escape character.
//  The reader learns "the next N bytes are payload", so payload bytes are
//  never inspected for meaning — 0x0a is just a byte here, not a record
//  boundary.
//  Two traps. First, `Buffer.byteLength(s, 'utf8')`, never `s.length`:
//  '👋'.length is 2 but it occupies 4 bytes, and a wrong length prefix
//  desynchronises every record after it. Second, endianness. writeUInt32LE
//  puts the low byte first, so 258 is 02 01 00 00. Little-endian is what
//  x86 and ARM use natively; big-endian ('BE') is the network default.
//  Pick one, write it in the format doc, and never mix them.
//  The decode loop is the framing pattern you will meet again on every
//  socket: consume whole records while you can, and hand back whatever is
//  left over so the caller can prepend it to the next chunk. `subarray`
//  is a view — no copying — which is why this stays cheap on big buffers.

import { test, eq, ok } from '../../_lib/check.js';

export function encodeRecord({ id, payload }) {
  const bytes = Buffer.from(payload, 'utf8');
  const buf = Buffer.allocUnsafe(8 + bytes.length);
  buf.writeUInt32LE(bytes.length, 0);
  buf.writeUInt32LE(id, 4);
  bytes.copy(buf, 8);
  return buf;
}

export function decodeRecords(buffer) {
  const records = [];
  let offset = 0;

  while (buffer.length - offset >= 8) {
    const length = buffer.readUInt32LE(offset);
    const end = offset + 8 + length;
    if (end > buffer.length) break; // the payload has not all arrived yet
    records.push({
      id: buffer.readUInt32LE(offset + 4),
      payload: buffer.toString('utf8', offset + 8, end),
    });
    offset = end;
  }

  return { records, rest: buffer.subarray(offset) };
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
