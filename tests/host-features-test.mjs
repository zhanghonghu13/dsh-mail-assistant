// End-to-end Host coverage with a mocked IMAP client: tools, Remote service,
// account resolution, classification, stats, digest, attachments and drafts.
// No network, no real mailbox, no credentials.
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { Context } from '@deepseek-ai/cordis';
import Registry from '@deepseek-ai/dsh-typert-registry';
import { apply, Config } from '../index.js';
import { ImapClient } from '../lib/imap.js';
import { TYPERT_REMOTE } from '../lib/remote.js';

const original = Object.fromEntries(['connect', 'login', 'logout', 'select', 'fetchEnvelopes', 'searchUid', 'fetchRawByUid']
  .map((name) => [name, ImapClient.prototype[name]]));

const attachment = Buffer.from('%PDF-1.4 fake attachment');
const rawWithAttachment = Buffer.from([
  'From: Boss <boss@work.example>',
  'To: Me <me@example.com>',
  'Cc: Team <team@work.example>',
  'Subject: 项目周报 截止 2026-11-02',
  'Date: Tue, 27 Oct 2026 10:00:00 +0800',
  'Message-ID: <m1@work.example>',
  'References: <m0@work.example>',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="B1"',
  '',
  '--B1',
  'Content-Type: text/plain; charset=utf-8',
  '',
  '请在本周五之前提交项目阶段性总结。',
  '--B1',
  'Content-Type: application/pdf; name="report.pdf"',
  'Content-Disposition: attachment; filename="report.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  attachment.toString('base64'),
  '--B1--',
  '',
].join('\r\n'));

const rawPlain = Buffer.from([
  'From: Me <me@example.com>',
  'To: Boss <boss@work.example>',
  'Subject: Re: 项目周报 截止 2026-11-02',
  'Message-ID: <m2@example.com>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8',
  '',
  '收到，我会按时提交。',
  '',
].join('\r\n'));

const summaries = [
  { uid: 11, subject: '项目周报 截止 2026-11-02', from: [{ name: 'Boss', address: 'boss@work.example' }], to: [{ name: 'Me', address: 'me@example.com' }], date: '2026-10-27T02:00:00.000Z', size: 900, seen: false },
  { uid: 12, subject: 'GitHub workflow failed', from: [{ name: 'GitHub', address: 'noreply@github.com' }], to: [{ name: 'Me', address: 'me@example.com' }], date: '2026-10-26T02:00:00.000Z', size: 400, seen: true },
  { uid: 13, subject: '限时优惠 立即下单', from: [{ name: 'Shop', address: 'promo@shop.example' }], to: [{ name: 'Me', address: 'me@example.com' }], date: '2026-10-25T02:00:00.000Z', size: 300, seen: true },
];

let connections = 0;
ImapClient.prototype.connect = async () => { connections += 1; };
ImapClient.prototype.login = async () => {};
ImapClient.prototype.logout = async () => {};
ImapClient.prototype.select = async () => ({ exists: summaries.length, uidValidity: 1 });
ImapClient.prototype.fetchEnvelopes = async (set) => {
  assert.equal(typeof set, 'string');
  const wanted = new Set();
  for (const part of set.split(',')) {
    if (part.includes(':')) {
      const [from, to] = part.split(':');
      const start = Number(from);
      const end = to === '*' ? summaries.length : Number(to);
      for (let value = start; value <= end; value += 1) wanted.add(value);
    } else {
      wanted.add(Number(part));
    }
  }
  return summaries
    .filter((summary, index) => wanted.has(summary.uid) || wanted.has(index + 1))
    .map((summary) => ({ ...summary }));
};
ImapClient.prototype.searchUid = async (criteria) => {
  if (criteria === 'UNSEEN') return [11];
  if (criteria.startsWith('SINCE ')) return [11, 12, 13];
  if (criteria === 'FROM "work.example"') return [11];
  if (criteria.includes('SUBJECT "周报"')) return [11];
  if (criteria.startsWith('UID ')) return summaries.map((summary) => summary.uid);
  return [];
};
ImapClient.prototype.fetchRawByUid = async (uid) => (uid === 12 ? rawPlain : rawWithAttachment);

const root = await mkdtemp(path.join(os.tmpdir(), 'mail-assistant-test-'));
const config = new Config({
  email: 'me@example.com', senderName: 'Me',
  imapHost: 'imap.example.com', smtpHost: 'smtp.example.com',
  downloadDir: root,
});

const tools = [];
const listeners = [];
const mockCtx = {
  fiber: {},
  effect: (fn) => fn() ?? (() => {}),
  get: () => undefined,
  inject: (deps, callback) => {
    callback({ effect: (fn) => fn(), settings: { configure: () => () => {} } });
    return () => {};
  },
  on: (name, handler) => { listeners.push({ name, handler }); return () => {}; },
  tools: { register: (tool) => { tools.push(tool); return () => {}; }, get: () => undefined },
  credentials: { resolve: async () => 'app-password' },
  systemPrompt: { section: () => () => {} },
};

try {
  apply(mockCtx, config);
  const tool = (name) => tools.find((entry) => entry.name === name);
  const call = (name, args) => tool(name).execute(args ?? {}, { signal: new AbortController().signal });

  // --- list: categories come from local rules, order is newest first.
  const listed = await call('mail_list', { limit: 10 });
  assert.equal(listed.total, 3);
  assert.deepEqual(listed.messages.map((message) => message.uid), [13, 12, 11]);
  assert.deepEqual(listed.messages.map((message) => message.category), ['promotion', 'notification', 'work']);
  assert.equal(listed.messages.at(-1).seen, false);

  // --- read: headers, body text and attachment metadata.
  const read = await call('mail_read', { uid: 11 });
  assert.equal(read.subject, '项目周报 截止 2026-11-02');
  assert.equal(read.to, 'Me <me@example.com>');
  assert.equal(read.cc, 'Team <team@work.example>');
  assert.ok(read.text.includes('请在本周五之前提交'));
  assert.deepEqual(read.attachments, [{ index: 1, filename: 'report.pdf', size: attachment.length }]);
  assert.equal(read.truncated, false);

  // --- search: server source, then local category filtering.
  const found = await call('mail_search', { from: 'work.example' });
  assert.equal(found.source, 'server');
  assert.equal(found.matches, 1);
  assert.equal(found.messages[0].uid, 11);
  const notifications = await call('mail_search', { since: '2020-01-01', category: 'notification' });
  assert.equal(notifications.messages.length, 1);
  assert.equal(notifications.messages[0].uid, 12);
  assert.ok(notifications.notice.includes('分类是本地规则建议'));

  // --- stats: unread/today/attention are computed, never invented.
  const stats = await call('mail_stats', { date: '2026-10-27', days: 90 });
  assert.equal(stats.unread, 1);
  assert.equal(stats.today, 3);
  assert.equal(stats.total, 3);
  assert.equal(stats.attention, 1);
  assert.ok(stats.scope.includes('2026-10-27'));
  assert.ok(Number.isFinite(Date.parse(stats.computedAt)));

  // --- digest: explicit deadline, source uid, and partial-scope notice.
  const digest = await call('mail_digest', { days: 90, limit: 30 });
  assert.equal(digest.scanned, 3);
  assert.ok(digest.deadlines.some((entry) => entry.uid === 11 && entry.text.includes('2026-11-02') && entry.confidence === 'explicit'));
  assert.ok(digest.needsAttention.some((entry) => entry.uid === 11));
  assert.ok(digest.notice.includes('本地规则摘要'));
  assert.ok(digest.aiPrompt.includes('请基于邮件助手'));

  // --- attachments are written inside the configured directory only.
  const saved = await call('mail_save_attachments', { uid: 11 });
  assert.equal(saved.saved.length, 1);
  assert.equal(path.dirname(saved.saved[0].path), root);
  assert.deepEqual(await readFile(saved.saved[0].path), attachment);

  // --- reply draft: recipients, Re: subject, threading headers, quoted body.
  const reply = await call('mail_reply', { uid: 11, body: '收到，我会按时提交。' });
  assert.match(reply.id, /^draft-/);
  assert.equal(reply.to, 'Boss <boss@work.example>');
  assert.equal(reply.subject, 'Re: 项目周报 截止 2026-11-02');
  assert.ok(reply.body.includes('> 请在本周五之前提交'));
  const drafts = await call('mail_drafts', {});
  assert.ok(drafts.drafts.some((draft) => draft.id === reply.id));

  // --- reply-all puts other recipients in Cc and never replies to yourself.
  const replyAll = await call('mail_reply', { uid: 11, body: '抄送大家。', replyAll: true });
  assert.equal(replyAll.to, 'Boss <boss@work.example>');
  assert.equal(replyAll.cc, 'Team <team@work.example>');

  // --- forward draft carries the original attachment (hash recorded at creation).
  const forward = await call('mail_forward', { uid: 11, to: ['other@example.com'], includeAttachments: true });
  assert.equal(forward.subject, 'Fwd: 项目周报 截止 2026-11-02');
  assert.deepEqual(forward.attachments, ['report.pdf']);
  assert.ok(forward.body.includes('---------- 原始邮件 ----------'));

  // --- the gate previews a stored draft and refuses attachment tampering.
  const gate = listeners.find((entry) => entry.name === 'tools/pre-execute').handler;
  const preview = gate({ name: 'mail_send_draft', arguments: { id: forward.id } }, () => 'next');
  assert.equal(preview.kind, 'ask');
  assert.ok(preview.reason.includes('other@example.com'));
  assert.ok(preview.reason.includes('原邮件附件'));
  const unknown = gate({ name: 'mail_send_draft', arguments: { id: 'draft-unknown' } }, () => 'next');
  assert.equal(unknown.kind, 'deny');

  // --- Remote contract: every method is registered, validated and callable.
  const remoteCtx = new Context();
  await remoteCtx.plugin(Registry);
  await remoteCtx.plugin({
    inject: ['typert'],
    apply(child) {
      apply({
        fiber: child.fiber,
        effect: (fn) => fn() ?? (() => {}),
        get: (name) => {
          if (name === 'llm') {
            return {
              async *stream() {
                yield { type: 'text-delta', text: JSON.stringify({
                  summary: '本周有一封需要回复的项目邮件。',
                  items: [{ uid: 11, kind: 'reply', why: '需要确认提交时间', deadline: '2026-11-02', confidence: 'explicit' }],
                  actions: ['确认项目周报提交时间'],
                }) };
                yield { type: 'finish', reason: { kind: 'stop' } };
              },
            };
          }
          if (name === 'agentDefaultModel') return { currentSelection: () => ({ provider: 'test', model: 'test-model' }) };
          return undefined;
        },
        inject: (deps, callback) => { if (deps[0] === 'typert') callback(child); else callback({ effect: (fn) => fn(), settings: { configure: () => () => {} } }); },
        on: () => () => {},
        tools: { register: () => () => {}, get: () => undefined },
        credentials: { resolve: async () => 'app-password' },
        systemPrompt: { section: () => () => {} },
      }, new Config({
        email: 'me@example.com', imapHost: 'imap.example.com', smtpHost: 'smtp.example.com', downloadDir: root,
      }));
    },
  });
  assert.deepEqual(remoteCtx.typert.local.list().map((entry) => entry.method).sort(), [
    'accounts', 'aiBrief', 'checkConnection', 'digest', 'draftCreate', 'draftDelete', 'draftReply', 'draftUpdate', 'drafts', 'list', 'log', 'overview', 'read', 'saveAttachments', 'search', 'stats',
  ]);
  const service = remoteCtx.get('mailAssistant');
  for (const [name, args] of [
    ['accounts', {}],
    ['list', { folder: 'INBOX', limit: 3 }],
    ['read', { uid: 11 }],
    ['search', { from: 'work.example' }],
    ['stats', { folder: 'INBOX', localDate: '2026-10-27', days: 90 }],
    ['digest', { folder: 'INBOX', days: 90, limit: 30 }],
    ['overview', { folder: 'INBOX', days: 90, limit: 30, localDate: '2026-10-27' }],
    ['saveAttachments', { uid: 11 }],
    ['drafts', {}],
    ['log', {}],
  ]) {
    const result = await service[name](args);
    const descriptor = TYPERT_REMOTE.methods[`mailAssistant/${name}`];
    assert.doesNotThrow(() => descriptor.result.create().parse(result), `${name} result matches its published schema`);
  }
  const createdDraft = await service.draftCreate({ subject: '可编辑草稿', body: '第一版正文' });
  assert.equal(createdDraft.status, 'saved');
  assert.equal(createdDraft.source, 'manual');
  assert.equal(createdDraft.accountId, 'default');
  const updatedDraft = await service.draftUpdate({ id: createdDraft.id, subject: '修改后的草稿', body: '第二版正文', to: ['a@example.com'] });
  assert.equal(updatedDraft.subject, '修改后的草稿');
  assert.ok(updatedDraft.updatedAt >= createdDraft.updatedAt);
  assert.equal(updatedDraft.to, 'a@example.com');
  assert.equal((await service.draftDelete({ id: createdDraft.id })).deleted, true);
  const replyDraft = await service.draftReply({ uid: 11 });
  assert.equal(replyDraft.source, 'reply');
  assert.ok(replyDraft.subject.startsWith('Re:'));
  assert.equal((await service.draftDelete({ id: replyDraft.id })).deleted, true);
  for (const [name, result] of [
    ['draftCreate', createdDraft], ['draftUpdate', updatedDraft], ['draftDelete', { id: createdDraft.id, deleted: true }],
    ['draftReply', replyDraft],
  ]) {
    const descriptor = TYPERT_REMOTE.methods[`mailAssistant/${name}`];
    assert.doesNotThrow(() => descriptor.result.create().parse(result), `${name} result matches its published schema`);
  }

  const aiBrief = await service.aiBrief({ days: 90, maxBodies: 2 });
  assert.equal(aiBrief.provider, 'test');
  assert.equal(aiBrief.items[0].uid, 11);
  assert.equal(aiBrief.items[0].kind, 'reply');
  assert.doesNotThrow(() => TYPERT_REMOTE.methods['mailAssistant/aiBrief'].result.create().parse(aiBrief));

  const connectionsBefore = connections;
  const overview = await service.overview({ folder: 'INBOX', days: 90, limit: 30, localDate: '2026-10-27' });
  assert.equal(overview.stats.unread, 1);
  assert.equal(overview.stats.today, 3);
  assert.equal(overview.stats.attention, 1);
  assert.equal(overview.digest.scanned, 3);
  assert.equal(overview.recent.length, 3);
  assert.deepEqual(overview.recent.map((message) => message.uid), [13, 12, 11]);
  assert.equal(connections - connectionsBefore, 1, 'overview uses one IMAP connection for stats, digest and recent');
  const log = await service.log();
  assert.ok(log.entries.length > 0);
  assert.ok(log.entries.every((entry) => !('body' in entry) && !('text' in entry)), 'log never stores message bodies');
  const descriptor = TYPERT_REMOTE.methods['mailAssistant/list'];
  assert.throws(() => descriptor.input().create().parse({ args: { limit: 51 } }), 'published input schema rejects out-of-range limits');

  console.log('All Host feature tests passed (list/read/search/stats/digest/attachments/drafts/remote).');
} finally {
  Object.assign(ImapClient.prototype, original);
  await rm(root, { recursive: true, force: true });
}
