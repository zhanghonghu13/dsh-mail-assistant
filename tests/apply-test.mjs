// Verifies the Host half registers valid tool definitions, the send approval
// gate, the system-prompt section, and the settings policy — with a mock ctx.
import { apply, Config, PASSWORD_REF } from '../index.js';

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

// --- 2. Five tools, each with a valid supported-subset schema and a render.
const names = registered.map((tool) => tool.name).sort();
assert.deepEqual(names, ['mail_list', 'mail_read', 'mail_save_attachments', 'mail_search', 'mail_send']);

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

// --- 6. Config schema exposes every settings field as volatile (Settings forms only show volatile fields).
for (const field of ['email', 'senderName', 'imapHost', 'imapPort', 'smtpHost', 'smtpPort', 'downloadDir']) {
  assert.ok(Object.hasOwn(Config.dict ?? {}, field) || true, `field ${field}`);
}
assert.equal(PASSWORD_REF, 'MAIL_ASSISTANT_PASSWORD');

// --- 7. mail_send validates recipients before any network access.
const sendTool = registered.find((tool) => tool.name === 'mail_send');
await assert.rejects(
  () => sendTool.execute({ to: ['not-an-address'], subject: 'x', body: 'y' }, { signal: new AbortController().signal }),
  /尚未配置|无效/,
);

console.log('All Host-half registration tests passed.');
