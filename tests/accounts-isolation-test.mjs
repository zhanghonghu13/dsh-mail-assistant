// Multi-account isolation: each account resolves its own credential reference,
// and no request can pair one account's password with another account's host.
import assert from 'node:assert/strict';
import { apply, Config } from '../index.js';
import { ImapClient } from '../lib/imap.js';
import { passwordRefFor } from '../lib/accounts.js';

const original = Object.fromEntries(['connect', 'login', 'logout', 'select', 'fetchEnvelopes', 'searchUid']
  .map((name) => [name, ImapClient.prototype[name]]));
const connections = [];
ImapClient.prototype.connect = async function connect() { connections.push({ host: this.host, user: this.user, password: this.password }); };
ImapClient.prototype.login = async () => {};
ImapClient.prototype.logout = async () => {};
ImapClient.prototype.select = async () => ({ exists: 0, uidValidity: 1 });
ImapClient.prototype.fetchEnvelopes = async () => [];
ImapClient.prototype.searchUid = async () => [];

const accounts = JSON.stringify([
  { id: 'default', email: 'a@163.com', imapHost: 'imap.163.com', smtpHost: 'smtp.163.com' },
  { id: 'work', email: 'b@example.com', imapHost: 'imap.example.com', smtpHost: 'smtp.example.com' },
]);
const resolved = [];
const tools = [];
apply({
  fiber: {}, effect: (fn) => fn() ?? (() => {}), get: () => undefined,
  inject: (_deps, callback) => { callback({ effect: (fn) => fn(), settings: { configure: () => () => {} } }); return () => {}; },
  on: () => () => {}, tools: { register: (tool) => { tools.push(tool); return () => {}; }, get: () => undefined },
  credentials: {
    resolve: async (ref) => { resolved.push(ref); return `secret-for-${ref}`; },
  },
  systemPrompt: { section: () => () => {} },
}, new Config({ accounts }));

const list = (args) => tools.find((tool) => tool.name === 'mail_list').execute(args);

try {
  await list({});
  assert.equal(connections.at(-1).user, 'a@163.com');
  assert.equal(connections.at(-1).host, 'imap.163.com');
  assert.equal(connections.at(-1).password, `secret-for-${passwordRefFor('default')}`);

  await list({ account: 'work' });
  assert.equal(connections.at(-1).user, 'b@example.com');
  assert.equal(connections.at(-1).host, 'imap.example.com');
  assert.equal(connections.at(-1).password, `secret-for-${passwordRefFor('work')}`);
  assert.notEqual(connections.at(-1).password, connections.at(-2).password);

  await assert.rejects(() => list({ account: 'missing' }), /找不到该邮箱账户/);
  assert.deepEqual(resolved, [passwordRefFor('default'), passwordRefFor('work')], 'one resolve per request, never reused across accounts');
  console.log('Multi-account isolation tests passed.');
} finally {
  Object.assign(ImapClient.prototype, original);
}
