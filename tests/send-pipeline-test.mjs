// Sending pipeline: reply/forward draft -> SMTP DATA, plus attachment tamper
// cancellation. Uses a throwaway local STARTTLS server and fixture credentials;
// no real mailbox or network is involved.
import assert from 'node:assert/strict';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import { readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { apply, Config } from '../index.js';
import { ImapClient } from '../lib/imap.js';
import { parseMessage } from '../lib/mime.js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // isolated throwaway server only
const key = readFileSync(new URL('./fixtures/localhost-key.pem', import.meta.url));
const cert = readFileSync(new URL('./fixtures/localhost-cert.pem', import.meta.url));
const secureContext = tls.createSecureContext({ key, cert });

const raw = Buffer.from([
  'From: Boss <boss@work.example>',
  'To: Me <me@example.com>',
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
  Buffer.from('%PDF fake').toString('base64'),
  '--B1--',
  '',
].join('\r\n'));

const summary = {
  uid: 11, subject: '项目周报 截止 2026-11-02',
  from: [{ name: 'Boss', address: 'boss@work.example' }],
  to: [{ name: 'Me', address: 'me@example.com' }], cc: [],
  date: '2026-10-27T02:00:00.000Z', size: 800, seen: false,
};
const originalImap = Object.fromEntries(['connect', 'login', 'logout', 'select', 'fetchEnvelopes', 'searchUid', 'fetchRawByUid']
  .map((name) => [name, ImapClient.prototype[name]]));
ImapClient.prototype.connect = async () => {};
ImapClient.prototype.login = async () => {};
ImapClient.prototype.logout = async () => {};
ImapClient.prototype.select = async () => ({ exists: 1, uidValidity: 1 });
ImapClient.prototype.fetchEnvelopes = async () => [{ ...summary }];
ImapClient.prototype.searchUid = async () => [11];
ImapClient.prototype.fetchRawByUid = async () => raw;

// --- local STARTTLS SMTP server that records the DATA body.
const delivered = [];
const smtpServer = net.createServer((socket) => {
  socket.write('220 mock smtp\r\n');
  let buffer = '';
  let inData = false;
  let data = '';
  let authStep = 0;
  let secured = null;
  let out = socket;
  const onLine = (line) => {
    if (inData) {
      if (line === '.') {
        inData = false;
        delivered.push(data);
        data = '';
        out.write('250 queued\r\n');
      } else {
        data += `${line}\r\n`;
      }
      return;
    }
    if (line.startsWith('EHLO')) out.write('250-mock\r\n250 STARTTLS\r\n');
    else if (line === 'STARTTLS') out.write('220 go ahead\r\n');
    else if (line === 'AUTH LOGIN') { authStep = 1; out.write('334 VXNlcg==\r\n'); }
    else if (authStep === 1) { authStep = 2; out.write('334 UGFzcw==\r\n'); }
    else if (authStep === 2) { authStep = 0; out.write('235 ok\r\n'); }
    else if (line.startsWith('MAIL FROM')) out.write('250 ok\r\n');
    else if (line.startsWith('RCPT TO')) out.write('250 ok\r\n');
    else if (line === 'DATA') { inData = true; out.write('354 end with .\r\n'); }
    else if (line === 'QUIT') { out.write('221 bye\r\n'); out.end(); }
    else out.write('250 ok\r\n');
  };
  const feed = (chunk) => {
    buffer += chunk.toString();
    let index;
    while ((index = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (line === 'STARTTLS' && secured === null) {
        socket.removeListener('data', plain);
        socket.write('220 go ahead\r\n', () => {
          secured = new tls.TLSSocket(socket, { isServer: true, secureContext });
          out = secured;
          secured.on('error', () => {});
          secured.on('data', (bytes) => feed(bytes));
        });
        return;
      }
      onLine(line);
    }
  };
  const plain = (chunk) => feed(chunk);
  socket.on('data', plain);
  socket.on('error', () => {});
});
await new Promise((resolve) => smtpServer.listen(0, '127.0.0.1', resolve));

const root = await mkdtemp(path.join(os.tmpdir(), 'mail-send-test-'));
const tools = [];
const listeners = [];
const config = new Config({
  email: 'me@example.com', senderName: 'Me',
  imapHost: 'imap.example.com', smtpHost: '127.0.0.1', smtpPort: smtpServer.address().port,
});
apply({
  fiber: {}, effect: (fn) => fn() ?? (() => {}), get: () => undefined,
  inject: (_deps, callback) => { callback({ effect: (fn) => fn(), settings: { configure: () => () => {} } }); return () => {}; },
  on: (name, handler) => { listeners.push({ name, handler }); return () => {}; },
  tools: { register: (tool) => { tools.push(tool); return () => {}; }, get: () => undefined },
  credentials: { resolve: async () => 'app-password' }, systemPrompt: { section: () => () => {} },
}, config);
const call = (name, args) => tools.find((tool) => tool.name === name).execute(args, { signal: new AbortController().signal });

try {
  // --- reply draft then send: threading headers and quoted body reach SMTP.
  const reply = await call('mail_reply', { uid: 11, body: '收到，我会按时提交。' });
  const sent = await call('mail_send_draft', { id: reply.id });
  assert.equal(sent.sent, true);
  assert.equal(delivered.length, 1);
  const message = delivered[0];
  assert.match(message, /^From: Me <me@example\.com>/m);
  assert.match(message, /^To: Boss <boss@work\.example>/m);
  assert.equal(parseMessage(Buffer.from(message)).subject, 'Re: 项目周报 截止 2026-11-02');
  assert.match(message, /^In-Reply-To: <m1@work\.example>/m);
  assert.match(message, /^References: <m0@work\.example> <m1@work\.example>/m);
  const bodyPart = message.split(/\r\n\r\n/).slice(1).join('\r\n\r\n').replace(/\r\n/g, '').trim();
  const decoded = Buffer.from(bodyPart, 'base64').toString('utf8');
  assert.ok(decoded.includes('收到，我会按时提交。'));
  assert.ok(decoded.includes('> 请在本周五之前提交'));

  // --- forward draft sends the original attachment.
  const forward = await call('mail_forward', { uid: 11, to: ['other@example.com'], includeAttachments: true });
  const forwarded = await call('mail_send_draft', { id: forward.id });
  assert.deepEqual(forwarded.attachments, ['report.pdf']);
  assert.equal(delivered.length, 2);
  assert.ok(delivered[1].includes('report.pdf'));

  // --- a draft whose attachment changed after creation must not be sent.
  const file = path.join(root, 'note.txt');
  writeFileSync(file, 'original');
  const draft = await call('mail_draft', { to: ['a@example.com'], subject: 'S', body: 'B', attachments: [file] });
  writeFileSync(file, 'tampered');
  await assert.rejects(() => call('mail_send_draft', { id: draft.id }), /发生变化/);
  assert.equal(delivered.length, 2, 'tampered attachment produced no delivery');

  // --- content changed after the approval snapshot must not send.
  const editable = await call('mail_draft', { to: ['a@example.com'], subject: '审批前', body: '旧正文' });
  const gate = listeners.find((entry) => entry.name === 'tools/pre-execute').handler;
  assert.equal(gate({ name: 'mail_send_draft', arguments: { id: editable.id } }, () => 'next').kind, 'ask');
  await call('mail_update_draft', { id: editable.id, subject: '审批后', body: '新正文' });
  await assert.rejects(() => call('mail_send_draft', { id: editable.id }), /确认后发生了变化/);
  assert.equal(delivered.length, 2, 'changed draft produced no delivery');

  console.log('Sending pipeline tests passed (threading, forward attachment, tamper cancellation).');
} finally {
  Object.assign(ImapClient.prototype, originalImap);
  await new Promise((resolve) => smtpServer.close(resolve));
  await rm(root, { recursive: true, force: true });
}
