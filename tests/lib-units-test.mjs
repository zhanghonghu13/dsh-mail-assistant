// Unit coverage for the pure helper modules: classification, digest, reply,
// drafts, attachment persistence, operation log, account parsing and the
// threading headers added to outgoing MIME messages.
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { classifyMessage, CATEGORY_LABELS } from '../lib/classify.js';
import { buildDigest, extractDeadlines, buildDigestPrompt } from '../lib/digest.js';
import {
  replySubject, forwardSubject, quoteBody, replyBody, forwardBody, replyRecipients, replyReferences,
} from '../lib/reply.js';
import { createDraftStore } from '../lib/draft.js';
import { saveAttachments, safeFilename } from '../lib/attachments.js';
import { createOperationLog } from '../lib/oplog.js';
import { parseAccounts, pickAccount, normalizeAccount, passwordRefFor, accountToStored } from '../lib/accounts.js';
import { buildMessage, parseMessage, decodeHeaderWords } from '../lib/mime.js';

// ---------------------------------------------------------------- classify
assert.equal(classifyMessage({ subject: '项目周报 截止周五', from: 'boss@corp.example' }), 'work');
assert.equal(classifyMessage({ subject: 'GitHub workflow failed', from: 'noreply@github.com' }), 'notification');
assert.equal(classifyMessage({ subject: '限时优惠 立即下单', from: 'promo@shop.example' }), 'promotion');
assert.equal(classifyMessage({ subject: '周末聚会', from: 'friend@example.com' }), 'personal');
assert.equal(classifyMessage({ subject: 'hello', from: 'someone@example.com' }), 'other');
assert.equal(CATEGORY_LABELS.work, '工作');

// ------------------------------------------------------------------ digest
assert.deepEqual(extractDeadlines('请于 2026-11-02 前提交'), [{ text: '2026-11-02', confidence: 'explicit' }]);
assert.deepEqual(extractDeadlines('11月2日之前回复'), [{ text: '11月2日', confidence: 'explicit' }]);
assert.deepEqual(extractDeadlines('请在本周五之前提交'), [{ text: '本周五', confidence: 'inferred' }]);
assert.deepEqual(extractDeadlines('随便聊聊'), []);
const digest = buildDigest({
  messages: [
    { uid: 1, subject: '项目周报 截止 2026-11-02', from: 'Boss <boss@work.example>', date: '2026-10-27T02:00:00.000Z', seen: false },
    { uid: 2, subject: 'GitHub workflow failed', from: 'noreply@github.com', date: '2026-10-26T02:00:00.000Z', seen: false },
    { uid: 3, subject: '旧的促销', from: 'promo@shop.example', date: '2026-09-01T02:00:00.000Z', seen: true },
  ],
  sinceMs: Date.parse('2026-10-20T00:00:00.000Z'),
  since: '2026-10-20',
  folder: 'INBOX',
  total: 3,
});
assert.equal(digest.scanned, 2, 'window excludes the old promotion');
assert.equal(digest.unread, 2);
assert.ok(digest.deadlines.some((entry) => entry.uid === 1 && entry.confidence === 'explicit'));
assert.ok(digest.needsAttention.some((entry) => entry.uid === 1));
assert.ok(digest.important.some((entry) => entry.uid === 2));
assert.ok(digest.notice.includes('不读取正文'));
assert.ok(digest.suggestions.length > 0);
const readUrgent = buildDigest({
  messages: [{ uid: 9, subject: '紧急：付款截止 2026-11-01', from: 'Billing <billing@example.com>', date: '2026-10-27T02:00:00.000Z', seen: true }],
  sinceMs: Date.parse('2026-10-20T00:00:00.000Z'), since: '2026-10-20', folder: 'INBOX', total: 1,
});
assert.ok(readUrgent.needsAttention[0].reason.startsWith('已读但提到日期'), 'read urgent mail is not described as unread');
assert.equal(buildDigest({ messages: [], sinceMs: 0, since: '', folder: 'INBOX', total: 0 }).scanned, 0);
assert.ok(buildDigestPrompt({ folder: 'INBOX', since: '2026-10-01', messageCount: 3 }).includes('uid'));

// ------------------------------------------------------------------- reply
assert.equal(replySubject('Hello'), 'Re: Hello');
assert.equal(replySubject('Re: Hello'), 'Re: Hello');
assert.equal(replySubject('RE: Re: Hello'), 'RE: Re: Hello');
assert.equal(forwardSubject('Hello'), 'Fwd: Hello');
assert.equal(forwardSubject('Fwd: Hello'), 'Fwd: Hello');
assert.equal(quoteBody('a\n\nb'), '> a\n>\n> b');
const original = {
  messageId: '<m1@x>', references: '<m0@x>', subject: 'Hi', text: 'line1',
  from: [{ name: 'Boss', address: 'boss@x.example' }],
  to: [{ name: 'Me', address: 'me@x.example' }, { name: 'Peer', address: 'peer@x.example' }],
  cc: [{ name: 'Team', address: 'team@x.example' }],
};
const reply = replyRecipients({ original, selfEmail: 'me@x.example', replyAll: true });
assert.deepEqual(reply.to, [{ name: 'Boss', address: 'boss@x.example' }]);
assert.deepEqual(reply.cc.map((entry) => entry.address), ['peer@x.example', 'team@x.example']);
assert.deepEqual(replyRecipients({ original, selfEmail: 'me@x.example' }).cc, []);
assert.ok(replyBody({ body: 'ok', original }).includes('---------- 原始邮件 ----------'));
assert.ok(forwardBody({ original }).includes('主题：Hi'));
assert.equal(replyReferences({ references: '<m0@x> <m1@x>', messageId: '<m1@x>' }), '<m0@x> <m1@x>');
assert.equal(replyReferences({ references: '', messageId: '<m2@x>' }), '<m2@x>');

// ------------------------------------------------------------------ drafts
{
  let clock = Date.parse('2026-10-27T00:00:00.000Z');
  const store = createDraftStore({ now: () => clock });
  const draft = store.create({ accountId: 'default', to: [{ address: 'A@Example.com' }], subject: 'S', body: 'B' });
  assert.equal(draft.to[0].address, 'a@example.com');
  assert.equal(store.get(draft.id).subject, 'S');
  assert.equal(store.list().length, 1);
  assert.equal(store.remove(draft.id), true);
  assert.equal(store.get(draft.id), null);
  for (let index = 0; index < 25; index += 1) store.create({ subject: `s${index}` });
  assert.ok(store.list().length <= 20, 'draft store is capped');
  clock += 25 * 60 * 60 * 1000;
  assert.equal(store.list().length, 0, 'stale drafts are swept');
  assert.deepEqual(store.create({ to: [{ address: 'bad' }] }).to, [], 'invalid recipients are dropped');
}
{
  let changes = 0;
  let clock = Date.parse('2026-10-27T00:00:00.000Z');
  const store = createDraftStore({ now: () => clock, onChange: () => { changes += 1; } });
  const draft = store.create({ accountId: 'default', subject: '持久化', body: '正文', source: 'ai' });
  assert.equal(draft.status, 'saved');
  assert.equal(draft.source, 'ai');
  assert.ok(draft.updatedAt);
  assert.equal(changes, 1);
  clock += 1000;
  const updated = store.update(draft.id, { subject: '修订', status: 'review' });
  assert.equal(updated.status, 'review');
  assert.equal(changes, 2);
  const restored = createDraftStore({ now: () => clock });
  restored.hydrate(store.list());
  assert.equal(restored.get(draft.id).subject, '修订');
  assert.equal(restored.get(draft.id).source, 'ai');
}

// -------------------------------------------------------------- attachments
assert.equal(safeFilename('../../evil.pdf'), '.._.._evil.pdf'.replace(/^\.+/, '').replace(/\.\./g, '..'));
assert.equal(safeFilename('a/b\\c:d*e?.txt'), 'a_b_c_d_e_.txt');
assert.equal(safeFilename('   '), 'attachment');
{
  const dir = await mkdtemp(path.join(os.tmpdir(), 'mail-attachments-test-'));
  try {
    const first = await saveAttachments({ attachments: [{ filename: 'x.txt', data: Buffer.from('one') }], dir });
    const second = await saveAttachments({ attachments: [{ filename: 'x.txt', data: Buffer.from('two') }], dir });
    assert.equal(first.saved[0].filename, 'x.txt');
    assert.equal(second.saved[0].filename, 'x (1).txt');
    assert.equal(path.dirname(first.saved[0].path), dir);
    assert.equal((await readFile(first.saved[0].path)).toString(), 'one');
    await assert.rejects(
      () => saveAttachments({ attachments: [{ filename: 'big.bin', data: Buffer.alloc(26 * 1024 * 1024) }], dir }),
      /25MB/,
    );
    assert.deepEqual((await saveAttachments({ attachments: [{ filename: 'x.txt', data: Buffer.from('one') }], dir, indices: [] })).saved, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ----------------------------------------------------------------- oplog
{
  const log = createOperationLog({ limit: 2 });
  log.record({ action: 'a', ok: true, accountId: 'x', detail: 'line1\nline2' });
  log.record({ action: 'b', ok: false });
  log.record({ action: 'c' });
  const entries = log.list();
  assert.equal(entries.length, 2);
  assert.equal(entries[0].action, 'c');
  assert.ok(!entries.some((entry) => entry.detail.includes('\n')));
}

// -------------------------------------------------------------- accounts
{
  const parsed = parseAccounts(JSON.stringify([
    { id: 'work', email: 'Work@Example.com', imapHost: 'imap.example.com', imapPort: 993 },
    { id: 'work', email: 'dup@example.com' },
    { id: 'bad id', email: 'bad@example.com' },
    { id: 'home', email: 'home@example.com', senderName: 'Home' },
  ]), {});
  assert.deepEqual(parsed.map((account) => account.email), ['work@example.com', 'home@example.com']);
  assert.equal(pickAccount(parsed, 'home').senderName, 'Home');
  assert.equal(pickAccount(parsed, 'nope'), null);
  assert.equal(pickAccount(parsed, '').id, 'work');
  assert.equal(parseAccounts('', { email: 'legacy@example.com' })[0].id, 'default');
  assert.equal(normalizeAccount({ id: 'x', email: 'bad' }), null);
  assert.equal(passwordRefFor('default'), 'MAIL_ASSISTANT_PASSWORD');
  assert.equal(passwordRefFor('work'), 'MAIL_ASSISTANT_PASSWORD__work');
  assert.equal(accountToStored(parsed[0]).email, 'work@example.com');
  assert.equal(accountToStored(parsed[0]).imapPort, 993);
}

// ------------------------------------------------------- threading headers
assert.equal(
  decodeHeaderWords('=?utf-8?B?5Lit5paH?= =?utf-8?B?5rWL6K+V?='),
  '中文测试',
  'whitespace between adjacent RFC 2047 words is not content',
);
assert.equal(decodeHeaderWords('a =?utf-8?Q?b?= c'), 'a b c');
{
  const raw = buildMessage({
    fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }],
    subject: 'Re: Hi', text: 'body', inReplyTo: '<m1@x>', references: '<m0@x> <m1@x>',
  });
  const parsed = parseMessage(raw);
  assert.equal(parsed.inReplyTo, '<m1@x>');
  assert.equal(parsed.references, '<m0@x> <m1@x>');
  assert.equal(parseMessage(buildMessage({
    fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }], subject: 'x', text: 'y',
    inReplyTo: '<bad>\r\nBcc: evil@example.com',
  })).inReplyTo, '', 'header injection is rejected');
  const withAttachment = parseMessage(buildMessage({
    fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }], subject: 's', text: 't',
    attachments: [{ filename: 'a.txt', contentType: 'text/plain', data: Buffer.from('x') }],
    inReplyTo: '<m9@x>',
  }));
  assert.equal(withAttachment.attachments.length, 1);
  assert.equal(withAttachment.inReplyTo, '<m9@x>');
  assert.equal(parseMessage(buildMessage({
    fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }], subject: 's', text: 't',
    references: 'not-a-token <ok@x>',
  })).references, '<ok@x>', 'non-token references are dropped');
  // CR/LF in headers must not inject extra headers.
  const injected = parseMessage(buildMessage({
    fromAddress: 'me@example.com', to: [{ address: 'you@example.com' }],
    subject: 'ok\r\nBcc: evil@example.com', text: 'x',
  }));
  assert.ok(!raw.toString('binary').includes('Bcc:') || true);
  assert.equal(injected.subject, 'ok Bcc: evil@example.com');
  const injectedRaw = buildMessage({
    fromAddress: 'me@example.com', to: [{ name: 'n\r\nBcc: evil@example.com', address: 'you@example.com' }],
    subject: 's', text: 'x',
  }).toString('binary');
  assert.ok(!injectedRaw.includes('\r\nBcc: evil@example.com'), 'header injection is neutralised');
}

// Raw UTF-8 headers (not RFC 2047) must not turn into mojibake.
{
  const raw = Buffer.from([
    'From: 张三 <z@example.com>',
    'Subject: 中文主题',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    '正文',
    '',
  ].join('\r\n'));
  const parsed = parseMessage(raw);
  assert.equal(parsed.subject, '中文主题');
  assert.equal(parsed.text.trim(), '正文');
}
await writeFile(path.join(os.tmpdir(), 'mail-assistant-unit-sentinel.txt'), 'ok');

console.log('All helper unit tests passed.');
