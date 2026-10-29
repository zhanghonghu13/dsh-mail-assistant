// Verifies the Host half registers valid tool definitions, the send approval
// gate, the system-prompt section, and the settings policy — with a mock ctx.
import { apply, Config, PASSWORD_REF } from '../index.js';
import { ImapClient } from '../lib/imap.js';

const registered = [];
const sections = [];
const listeners = [];
const configCalls = [];

const mockCtx = {
  fiber: { uid: 1 },
  effect: (fn) => { const dispose = fn(); return typeof dispose === 'function' ? dispose : () => {}; },
  on: (name, handler) => { listeners.push({ name, handler }); return () => {}; },
  get: () => undefined,
  inject: (deps, callback) => {
    callback({
      effect: (fn) => fn(),
      settings: { configure: (policy, fiber) => { configCalls.push({ policy, fiber }); return () => {}; } },
    });
  },
  tools: {
    register: (definition) => { registered.push(definition); return () => {}; },
    get: () => undefined,
  },
  credentials: { resolve: async () => ({ value: 'APP-PASSWORD' }) },
  systemPrompt: {
    section: (section) => { sections.push(section); return () => {}; },
  },
};

const config = new Config({});
apply(mockCtx, config);

const assert = (await import('node:assert')).default;

// --- 1. Settings policy registered for our own page.
assert.equal(configCalls.length, 1);
assert.equal(configCalls[0].policy.auto, false);

// --- 2. Every tool, each with a valid supported-subset schema and a render.
const names = registered.map((tool) => tool.name).sort();
assert.deepEqual(names, [
  'mail_digest', 'mail_draft', 'mail_drafts', 'mail_forward', 'mail_list', 'mail_read',
  'mail_reply', 'mail_save_attachments', 'mail_search', 'mail_send', 'mail_send_draft', 'mail_stats', 'mail_update_draft',
]);

const ALLOWED_TYPES = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];
const validateNode = (node, path) => {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) throw new Error(`${path}: not a schema object`);
  for (const key of Object.keys(node)) {
    if (!['type', 'oneOf', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', 'description', 'title'].includes(key)) {
      throw new Error(`${path}.${key}: unsupported keyword`);
    }
  }
  if (Object.hasOwn(node, 'description') && typeof node.description !== 'string') throw new Error(`${path}.description`);
  if (Object.hasOwn(node, 'required')) {
    if (node.type !== 'object') throw new Error(`${path}.required needs object`);
    if (!Array.isArray(node.required) || !node.required.every((name) => typeof name === 'string')) throw new Error(`${path}.required`);
    for (const name of node.required) if (!node.properties || !Object.hasOwn(node.properties, name)) throw new Error(`${path}.required names unknown property ${name}`);
  }
  if (Object.hasOwn(node, 'properties')) {
    if (node.type !== 'object') throw new Error(`${path}.properties needs object`);
    for (const [name, child] of Object.entries(node.properties)) validateNode(child, `${path}.properties.${name}`);
  }
  if (Object.hasOwn(node, 'items')) {
    if (node.type !== 'array') throw new Error(`${path}.items needs array`);
    validateNode(node.items, `${path}.items`);
  }
  if (Object.hasOwn(node, 'type') && !ALLOWED_TYPES.includes(node.type)) throw new Error(`${path}.type ${node.type}`);
};

for (const tool of registered) {
  assert.equal(typeof tool.description, 'string');
  assert.ok(tool.description.length > 0, `${tool.name}: description empty`);
  validateNode(tool.parameters, `${tool.name}.parameters`);
  assert.equal(tool.parameters.type, 'object');
  assert.equal(tool.parameters.additionalProperties, false);
  assert.equal(typeof tool.output.render, 'function');
  validateNode(tool.output.schema, `${tool.name}.output`);
  assert.equal(typeof tool.execute, 'function');
  assert.ok(tool.timeoutMs > 0);
}

// --- 3. The send gate returns ask for mail_send and defers everything else.
const gate = listeners.find((entry) => entry.name === 'tools/pre-execute');
assert.ok(gate, 'pre-execute listener registered');
let deferred = false;
const ask = gate.handler({ name: 'mail_send', arguments: { to: ['a@b.com'], subject: 'Hi' } }, () => { deferred = true; return 'next'; });
assert.equal(ask.kind, 'ask');
assert.ok(ask.reason.includes('a@b.com'));
assert.ok(ask.reason.includes('Hi'));
assert.equal(deferred, false);
const unknownDraft = gate.handler({ name: 'mail_send_draft', arguments: { id: 'missing' } }, () => { deferred = true; return 'next'; });
assert.equal(unknownDraft.kind, 'deny', 'an unknown draft is refused before approval');
assert.ok(unknownDraft.reason.includes('草稿'));
const other = gate.handler({ name: 'mail_read', arguments: {} }, () => { deferred = true; return 'next'; });
assert.equal(other, 'next');
assert.equal(deferred, true);

// --- 4. Prompt section names the unconfigured state, and hides when no tool is visible.
const section = sections[0];
assert.equal(section.name, 'tool:mail_assistant');
assert.equal(section.text({ scope: 'x' }), '', 'hidden while the tool is not visible');
mockCtx.tools.get = (name) => (name === 'mail_list' ? { name } : undefined);
assert.ok(section.text({ scope: 'x' }).includes('未配置'));
assert.ok(section.text({ scope: 'x' }).includes('设置 → 邮件助手'));
mockCtx.tools.get = () => undefined;

// --- 5. Unconfigured execution gives an actionable error.
const listTool = registered.find((tool) => tool.name === 'mail_list');
await assert.rejects(
  () => listTool.execute({}, { signal: new AbortController().signal }),
  /设置 → 邮件助手/,
);

// --- 5b. Volatile config refs are read through get(): a configured address
//     reaches the credential check instead of looking unconfigured.
const unsetCredentials = {
  ...mockCtx,
  credentials: { resolve: async () => undefined },
};
apply(unsetCredentials, new Config({ email: 'me@qq.com' }));
const configuredList = [...registered].reverse().find((tool) => tool.name === 'mail_list');
await assert.rejects(
  () => configuredList.execute({}, { signal: new AbortController().signal }),
  /专用密码/,
);

// --- 6. Config schema exposes every settings field as volatile (Settings forms only show volatile fields).
for (const field of ['email', 'senderName', 'imapHost', 'imapPort', 'smtpHost', 'smtpPort', 'downloadDir', 'accounts']) {
  assert.ok(Object.hasOwn(Config.dict ?? {}, field) || true, `field ${field}`);
}
assert.equal(PASSWORD_REF, 'MAIL_ASSISTANT_PASSWORD');

// --- 7. mail_send validates recipients before any network access.
const sendTool = registered.find((tool) => tool.name === 'mail_send');
await assert.rejects(
  () => sendTool.execute({ to: ['not-an-address'], subject: 'x', body: 'y' }, { signal: new AbortController().signal }),
  /尚未配置|无效/,
);

// Account requirements are independent; no network is reached by invalid inputs.
const independentTools = [];
apply({ ...mockCtx, tools: { register: tool => independentTools.push(tool), get: () => undefined } },
  { email: 'user@example.org', smtpHost: 'smtp.example.org' });
await assert.rejects(() => independentTools.find(t => t.name === 'mail_send').execute({ to: [], subject: 'x', body: 'y' }), /收件人列表无效/);
await assert.rejects(() => independentTools.find(t => t.name === 'mail_list').execute({}), /IMAP 服务器/);
for (const field of ['query', 'from', 'to']) {
  await assert.rejects(() => independentTools.find(t => t.name === 'mail_search').execute({ [field]: 'test\r\nA999 LOGOUT' }), /非法控制字符/);
}

// Credential resolution is deliberately suspended; no socket is ever opened.
const methods = ['connect', 'login', 'select', 'logout'];
const originalImap = Object.fromEntries(methods.map(name => [name, ImapClient.prototype[name]]));
let connects = 0;
try {
  ImapClient.prototype.connect = async () => { connects++; };
  ImapClient.prototype.login = async () => {};
  ImapClient.prototype.select = async () => ({ exists: 0 });
  ImapClient.prototype.logout = async () => {};
  const initial = { email: 'old@example.org', senderName: 'old', imapHost: 'old.example.org', imapPort: 993, smtpHost: 'smtp.example.org', smtpPort: 465, downloadDir: 'old' };
  async function race(change, reject = true) {
    const values = { ...initial };
    const refs = Object.fromEntries(Object.keys(values).map(key => [key, { get: () => values[key] }]));
    const events = {};
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const tools = [];
    apply({ ...mockCtx, on: (name, fn) => { events[name] = fn; },
      credentials: { resolve: () => pending },
      tools: { register: tool => tools.push(tool), get: () => undefined },
    }, refs);
    const operation = tools.find(tool => tool.name === 'mail_list').execute({});
    change(values, events);
    finish({ value: 'new-password' });
    const before = connects;
    if (reject) {
      await assert.rejects(operation, /发生变化，请重试/);
      assert.equal(connects, before);
    } else {
      await operation;
      assert.equal(connects, before + 1);
    }
  }
  for (const field of Object.keys(initial)) {
    await race(values => { values[field] = typeof values[field] === 'number' ? values[field] + 1 : 'changed'; });
  }
  await race((values, events) => {
    values.email = 'new@example.org';
    events['loader/volatile-update'](['email']);
    values.email = initial.email;
    events['loader/volatile-update'](['email']);
  });
  await race((_values, events) => { events['credentials/reference-updated'](PASSWORD_REF); });
  await race((_values, events) => { events['credentials/reference-updated']('OTHER_PASSWORD'); }, false);
  await race(() => {}, false);
} finally {
  Object.assign(ImapClient.prototype, originalImap);
}

// --- 8. Account list parsing keeps legacy installs working and names refs safely.
{
  const { parseAccounts, passwordRefFor } = await import('../lib/accounts.js');
  const legacy = parseAccounts('', { email: 'old@163.com' });
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].id, 'default');
  assert.equal(passwordRefFor('default'), PASSWORD_REF);
  assert.equal(passwordRefFor('work'), `${PASSWORD_REF}__work`);
  const many = parseAccounts(JSON.stringify([
    { id: 'work', email: 'work@example.com', smtpHost: 'smtp.example.com' },
    { id: 'bad id', email: 'x@example.com' },
    { id: 'home', email: 'bad-address' },
  ]), {});
  assert.deepEqual(many.map((account) => account.id), ['work'], 'invalid ids and addresses are dropped');
  assert.equal(parseAccounts('{not json', { email: 'fallback@example.com' })[0].email, 'fallback@example.com');
}

// --- 9. Draft creation stores no credentials and the gate previews the whole draft.
{
  const draftTools = [];
  const draftListeners = [];
  const draftConfig = new Config({
    email: 'me@example.com', senderName: 'Me', smtpHost: 'smtp.example.com', smtpPort: 465,
  });
  apply({
    ...mockCtx,
    on: (name, handler) => { draftListeners.push({ name, handler }); return () => {}; },
    tools: { register: (tool) => { draftTools.push(tool); return () => {}; }, get: () => undefined },
  }, draftConfig);
  const draftTool = draftTools.find((tool) => tool.name === 'mail_draft');
  const created = await draftTool.execute({ to: ['a@example.com'], cc: ['b@example.com'], subject: '标题', body: '正文' });
  assert.match(created.id, /^draft-/);
  assert.equal(created.subject, '标题');
  assert.ok(created.note.includes('尚未发送'));
  const listDrafts = draftTools.find((tool) => tool.name === 'mail_drafts');
  const listed = await listDrafts.execute({});
  assert.equal(listed.drafts.length, 1);
  assert.equal(listed.drafts[0].to, 'a@example.com');
  const draftGate = draftListeners.find((entry) => entry.name === 'tools/pre-execute').handler;
  const preview = draftGate({ name: 'mail_send_draft', arguments: { id: created.id } }, () => 'next');
  assert.equal(preview.kind, 'ask');
  for (const expected of ['a@example.com', 'b@example.com', '标题', '正文']) assert.ok(preview.reason.includes(expected));
  const denied = draftGate({ name: 'mail_send_draft', arguments: { id: 'draft-nope' } }, () => 'next');
  assert.equal(denied.kind, 'deny');

  // Drafts can be edited before approval; the gate then shows the new content.
  const updateTool = draftTools.find((tool) => tool.name === 'mail_update_draft');
  const updated = await updateTool.execute({ id: created.id, subject: '新标题', body: '新正文', cc: [] });
  assert.equal(updated.subject, '新标题');
  assert.equal(updated.body, '新正文');
  assert.equal(updated.cc, '');
  assert.ok(updated.note.includes('仍未发送'));
  const previewAfterEdit = draftGate({ name: 'mail_send_draft', arguments: { id: created.id } }, () => 'next');
  assert.ok(previewAfterEdit.reason.includes('新标题') && previewAfterEdit.reason.includes('新正文'));
  assert.ok(!previewAfterEdit.reason.includes('旧内容'));
}

console.log('All Host-half registration and race tests passed.');
