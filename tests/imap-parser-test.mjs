// Offline tests for the IMAP response parsers using realistic server bytes.
import { parserInternals } from '../lib/imap.js';
import assert from 'node:assert';

const { parseFetchRecord, envelopeToSummary } = parserInternals;

// 1. Envelope fetch with a literal subject (runtime strips the {N} marker).
const subject = '关于季度报告的说明';
const envelopeLine = `* 5 FETCH (UID 4321 FLAGS (\\Seen) RFC822.SIZE 4096 ENVELOPE ("Mon, 27 Oct 2026 10:00:00 +0800" `;
const parts = [
  { text: envelopeLine },
  { literal: Buffer.from(subject, 'utf-8') },
  { text: ' (("张三" NIL "zhang" "example.com")) NIL NIL (("lisi" NIL "lisi" "test.io")) NIL NIL "<msg-1@example.com>))' },
];
const record = parseFetchRecord(parts);
const summary = envelopeToSummary(record, Number(record['RFC822.SIZE']));
assert.equal(summary.uid, 4321);
assert.equal(summary.subject, '关于季度报告的说明');
assert.equal(summary.from[0].name, '张三');
assert.equal(summary.from[0].address, 'zhang@example.com');
assert.equal(summary.to[0].address, 'lisi@test.io');
assert.equal(summary.seen, true);
assert.equal(summary.size, 4096);

// 2. Envelope with RFC2047-encoded subject and no literals.
const encoded = '=?utf-8?B?' + Buffer.from('会议通知').toString('base64') + '?=';
const plain = [
  { text: '* 2 FETCH (UID 11 FLAGS () RFC822.SIZE 1024 ENVELOPE ("Tue, 21 Oct 2026 08:30:00 +0800" "' + encoded + '" (("Bob" NIL "bob" "x.org")) NIL NIL NIL NIL NIL "<2@x.org>))' },
];
const plainRecord = parseFetchRecord(plain);
const plainSummary = envelopeToSummary(plainRecord, Number(plainRecord['RFC822.SIZE']));
assert.equal(plainSummary.subject, '会议通知');
assert.equal(plainSummary.seen, false);
assert.equal(plainSummary.from[0].address, 'bob@x.org');

// 3. ENVELOPE date string survives as text (display only).
assert.ok(plainSummary.date.includes('Oct 2026'));

// 4. Two literals inside one ENVELOPE (runtime strips each {N} marker):
//    subject literal, then a display-name literal inside the FROM address group.
const twoLiterals = [
  { text: '* 3 FETCH (UID 99 ENVELOPE ("d1" ' },
  { literal: Buffer.from('主题一', 'utf-8') },
  { text: ' ((' },
  { literal: Buffer.from('发件人名', 'utf-8') },
  { text: ' NIL "mb" "hm")) NIL NIL NIL NIL NIL NIL NIL))' },
];
const twoRecord = parseFetchRecord(twoLiterals);
const twoSummary = envelopeToSummary(twoRecord, 0);
assert.equal(twoSummary.subject, '主题一');
assert.equal(twoSummary.from[0].name, '发件人名');
assert.equal(twoSummary.from[0].address, 'mb@hm');

// 5. NIL subject and empty address groups.
const nils = [
  { text: '* 1 FETCH (UID 5 ENVELOPE (NIL NIL NIL NIL NIL NIL NIL NIL NIL NIL))' },
];
const nilRecord = parseFetchRecord(nils);
const nilSummary = envelopeToSummary(nilRecord, 1);
assert.equal(nilSummary.subject, '');
assert.equal(nilSummary.from.length, 0);

console.log('All IMAP parser tests passed.');
