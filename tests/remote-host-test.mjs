import assert from 'node:assert/strict';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import { readFileSync } from 'node:fs';
import { Context } from '@deepseek-ai/cordis';
import Registry from '@deepseek-ai/dsh-typert-registry';
import { apply } from '../index.js';
import { TYPERT_REMOTE } from '../lib/remote.js';
import { verifySmtp } from '../lib/smtp.js';
import { ImapClient } from '../lib/imap.js';

// Public registry + real Cordis service, not an invented mock transport.
const ctx = new Context();
await ctx.plugin(Registry);
let gate;
const registration = ctx.plugin({ inject: ['typert'], apply(child) {
  apply({
    fiber: child.fiber,
    inject(deps, callback) {
      if (deps[0] === 'typert') callback(child);
      else callback({ effect: fn => fn(), settings: { configure: () => () => {} } });
    },
    tools: { register() {}, get() {} },
    credentials: { resolve: async () => { throw new Error('sensitive-secret'); } },
    systemPrompt: { section() {} },
    on(name, handler) { if (name === 'tools/pre-execute') gate = handler; },
  }, { email: 'user@example.org', imapHost: 'imap.example.org', smtpHost: 'smtp.example.org' });
} });
await registration;
assert.deepEqual(ctx.typert.local.list().map(x => x.method).sort(), [
  'accounts', 'aiBrief', 'checkConnection', 'digest', 'draftCreate', 'draftDelete', 'draftReply', 'draftUpdate', 'drafts', 'list', 'log', 'overview', 'read', 'saveAttachments', 'search', 'stats',
]);
const service = ctx.get('mailAssistant');
assert.ok(service);
assert.deepEqual(await service.checkConnection(), {
  accountId: '', email: '', status: 'unavailable',
  imap: { ok: false, status: 'unavailable' }, smtp: { ok: false, status: 'unavailable' },
});
await assert.rejects(() => service.list({}), error => !error.message.includes('sensitive-secret'));
await assert.rejects(() => service.read({ uid: 1 }), error => !error.message.includes('sensitive-secret'));
// Missing SMTP configuration must not block a real IMAP probe, including SELECT.
const second = new Context();
await second.plugin(Registry);
let selected = false;
const originals = Object.fromEntries(['connect', 'login', 'select', 'logout'].map(name => [name, ImapClient.prototype[name]]));
try {
  ImapClient.prototype.connect = async () => {};
  ImapClient.prototype.login = async () => {};
  ImapClient.prototype.select = async folder => { selected = folder === 'INBOX'; return { exists: 0 }; };
  ImapClient.prototype.logout = async () => {};
  await second.plugin({ inject: ['typert'], apply(child) {
    apply({
      fiber: child.fiber,
      inject(deps, callback) { if (deps[0] === 'typert') callback(child); else callback({ effect: fn => fn(), settings: { configure: () => () => {} } }); },
      tools: { register() {}, get() {} }, credentials: { resolve: async () => 'secret' }, systemPrompt: { section() {} }, on() {},
    }, { email: 'user@example.org', imapHost: 'imap.example.org' });
  } });
  const status = await second.get('mailAssistant').checkConnection();
  assert.equal(status.imap.status, 'ok');
  assert.equal(status.smtp.status, 'incomplete');
  assert.equal(selected, true);
  const descriptor = TYPERT_REMOTE.methods['mailAssistant/list'];
  const input = descriptor.input({ strict: true }).create().parse({ args: { folder: 'INBOX', limit: 3 } });
  const result = await descriptor.invoke({ mailAssistant: second.get('mailAssistant') }, input);
  assert.deepEqual(descriptor.result.create().parse(result), { folder: 'INBOX', total: 0, messages: [] });
} finally {
  Object.assign(ImapClient.prototype, originals);
}
const list = TYPERT_REMOTE.methods['mailAssistant/list'];
assert.throws(() => list.input().create().parse({ args: { limit: 51 } }));
assert.throws(() => list.input().create().parse({ args: { folder: 'INBOX', password: 'secret' } }));
const deniedAttachment = gate({ name: 'mail_send', arguments: { to: ['a@example.org'], subject: 's', body: 'b', attachments: ['definitely-missing-file.txt'] } }, () => null);
assert.equal(deniedAttachment.kind, 'deny', 'missing attachments are refused before approval');
const attachFile = path.join(os.tmpdir(), `mail-assistant-gate-${Date.now()}.txt`);
await (await import('node:fs/promises')).writeFile(attachFile, 'gate content');
try {
  const reason = gate({ name: 'mail_send', arguments: { to: ['a@example.org'], cc: ['b@example.org'], bcc: ['c@example.org'], subject: 'subject', body: 'body', html: '<p>html</p>', attachments: [attachFile] } }, () => null).reason;
  for (const text of ['a@example.org', 'b@example.org', 'c@example.org', 'subject', 'body', 'HTML', path.basename(attachFile), 'SHA-256']) assert.ok(reason.includes(text), `approval shows ${text}`);
} finally {
  await (await import('node:fs/promises')).rm(attachFile, { force: true });
}

// A server lacking STARTTLS must never receive AUTH or any mail commands.
const received = [];
const server = net.createServer(socket => {
  socket.write('220 mock\r\n');
  let buffer = '';
  socket.on('data', chunk => {
    buffer += chunk.toString();
    let at;
    while ((at = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, at); buffer = buffer.slice(at + 2); received.push(line);
      if (line.startsWith('EHLO')) socket.write('250 mock\r\n');
    }
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await assert.rejects(() => verifySmtp({ host: '127.0.0.1', port: server.address().port, user: 'user', password: 'secret', timeoutMs: 1000 }), /STARTTLS/);
await new Promise(resolve => server.close(resolve));
assert.deepEqual(received, ['EHLO mail-assistant.local']);
// Exercise successful STARTTLS + AUTH using only a throwaway local certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const secureContext = tls.createSecureContext({ key: readFileSync(new URL('./fixtures/localhost-key.pem', import.meta.url)), cert: readFileSync(new URL('./fixtures/localhost-cert.pem', import.meta.url)) });
const commands = [];
const tlsServer = net.createServer(socket => {
  socket.write('220 mock\r\n');
  let buffer = '';
  socket.on('data', function plain(chunk) {
    buffer += chunk.toString();
    let at;
    while ((at = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, at); buffer = buffer.slice(at + 2); commands.push(line);
      if (line.startsWith('EHLO')) socket.write('250-mock\r\n250 STARTTLS\r\n');
      else if (line === 'STARTTLS') {
        socket.removeListener('data', plain);
        socket.write('220 go ahead\r\n', () => {
          const secured = new tls.TLSSocket(socket, { isServer: true, secureContext });
          let pending = '', step = 0;
          secured.on('error', () => {});
          secured.on('data', bytes => {
            pending += bytes.toString();
            let pos;
            while ((pos = pending.indexOf('\r\n')) >= 0) {
              const cmd = pending.slice(0, pos); pending = pending.slice(pos + 2); commands.push(cmd);
              if (cmd.startsWith('EHLO')) secured.write('250 mock\r\n');
              else if (cmd === 'AUTH LOGIN') { step = 1; secured.write('334 VXNlcg==\r\n'); }
              else if (step === 1) { step = 2; secured.write('334 UGFzcw==\r\n'); }
              else if (step === 2) { step = 3; secured.write('235 ok\r\n'); }
              else if (cmd === 'QUIT') { secured.write('221 bye\r\n'); secured.end(); }
            }
          });
        });
      }
    }
  });
});
await new Promise(resolve => tlsServer.listen(0, '127.0.0.1', resolve));
await verifySmtp({ host: '127.0.0.1', port: tlsServer.address().port, user: 'user', password: 'secret', timeoutMs: 3000 });
const third = new Context();
await third.plugin(Registry);
await third.plugin({ inject: ['typert'], apply(child) {
  apply({
    fiber: child.fiber,
    inject(deps, callback) { if (deps[0] === 'typert') callback(child); else callback({ effect: fn => fn(), settings: { configure: () => () => {} } }); },
    tools: { register() {}, get() {} }, credentials: { resolve: async () => 'secret' }, systemPrompt: { section() {} }, on() {},
  }, { email: 'user@example.org', smtpHost: '127.0.0.1', smtpPort: tlsServer.address().port });
} });
assert.deepEqual(await third.get('mailAssistant').checkConnection(), {
  accountId: 'default', email: 'user@example.org',
  status: 'tested', imap: { ok: false, status: 'incomplete' }, smtp: { ok: true, status: 'ok' },
});
await new Promise(resolve => tlsServer.close(resolve));
const conversation = user => ['EHLO mail-assistant.local', 'STARTTLS', 'EHLO mail-assistant.local', 'AUTH LOGIN', Buffer.from(user).toString('base64'), Buffer.from('secret').toString('base64'), 'QUIT'];
assert.deepEqual(commands, [...conversation('user'), ...conversation('user@example.org')]);
console.log('Remote registration, validation, redaction and SMTP no-send TLS tests passed.');
