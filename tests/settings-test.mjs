// Settings: repeated saves keep working, multi-account edits persist as JSON, and
// each account uses its own credential reference.
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

let factory;
globalThis.window = { __ModuleLoader__: { load: (spec) => { factory = spec.factory; } } };
globalThis.document = { querySelector: () => ({}), createElement: () => ({ dataset: {} }), head: { appendChild() {} } };
await import('../client.js');
const module = factory((name) => { assert.equal(name, 'react'); return React; });
const registrations = [];
const config = { email: 'before@example.com' };
const scopeSnapshot = { status: 'ready', writable: true, revision: 1, value: config };
const scope = {
  getSnapshot: () => scopeSnapshot,
  subscribe: () => () => {},
  set: async (key, value) => { config[key] = value; return true; },
  unset: async (key) => { delete config[key]; return true; },
};
const credentialCalls = [];
const credentials = {
  describe: async (refs) => ({
    ok: true,
    value: Object.fromEntries(refs.map((ref) => [ref, { configured: ref.endsWith('__account2') ? false : true }])),
  }),
  set: async (ref, value) => { credentialCalls.push([ref, value]); return { ok: true }; },
  unset: async (ref) => { credentialCalls.push([ref, null]); return { ok: true }; },
};
let dictionary;
const ctx = {
  effect: (fn) => fn(),
  inject: (_deps, cb) => cb({ effect: (fn) => fn(), remote: { credentials, $on: () => () => {} } }),
  locale: { register: (_ns, dict) => { dictionary = dict.zh; }, bind: () => (key) => dictionary[key] ?? key },
  remote: { credentials },
  configForms: { describe: () => ({ getSnapshot: () => ({ view: { namespaces: [{ ns: 'mail-assistant' }] } }), subscribe: () => () => {} }), get: () => scope },
  slots: { inject: (_key, cb) => cb(), register: (options, component) => { registrations.push({ options, component }); } },
};
module.apply(ctx);
const entry = registrations.find((x) => x.options.name === 'settings.section');
let renderer;
await act(async () => { renderer = TestRenderer.create(React.createElement(entry.component, entry.options.inject())); });
await act(async () => { await Promise.resolve(); });
const rowTexts = () => renderer.root.findAll((node) => node.type === 'span' && node.props.className === 'ma-rowTitle')
  .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''));
assert.ok(rowTexts().includes('已保存密码'), 'credentials describe result {ok,value} is unwrapped, not read as a record');
const findInput = (type) => renderer.root.find((node) => node.type === 'input' && node.props.type === type);
const saveButton = () => renderer.root.find((node) => node.type === 'button' && node.props.className?.includes('ma-primaryButton'));
const textOf = (node) => {
  const children = node.props.children;
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.filter((child) => typeof child === 'string').join('');
  return '';
};
const buttonByText = (text) => renderer.root.find((node) => node.type === 'button' && textOf(node) === text);

// --- repeated saves
await act(async () => { findInput('email').props.onChange({ target: { value: 'after@example.com' } }); });
await act(async () => { await saveButton().props.onClick(); });
assert.equal(config.email, 'after@example.com');
assert.equal(saveButton().props.disabled, true);
await act(async () => { findInput('email').props.onChange({ target: { value: 'again@example.com' } }); });
assert.equal(saveButton().props.disabled, false, 'editing a field enables the next save');
await act(async () => { await saveButton().props.onClick(); });
assert.equal(config.email, 'again@example.com');
await act(async () => { findInput('password').props.onChange({ target: { value: 'new-password' } }); });
assert.equal(saveButton().props.disabled, false, 'editing the password enables the next save');

// --- legacy account is migrated into the accounts JSON without losing the address
assert.ok(typeof config.accounts === 'string' && config.accounts.includes('again@example.com'), 'accounts JSON mirrors the legacy account');

// --- add a second account, edit it, save, and check its own credential reference
await act(async () => { await buttonByText('添加账户').props.onClick(); });
const idInput = () => renderer.root.find((node) => node.type === 'input' && node.props['aria-label'] === '账户 id');
await act(async () => { idInput().props.onChange({ target: { value: 'work' } }); });
await act(async () => { findInput('email').props.onChange({ target: { value: 'work@example.com' } }); });
await act(async () => { findInput('password').props.onChange({ target: { value: 'work-secret' } }); });
await act(async () => { await saveButton().props.onClick(); });
const stored = JSON.parse(config.accounts);
assert.deepEqual(stored.map((item) => item.id), ['default', 'work']);
assert.equal(stored[1].email, 'work@example.com');
assert.deepEqual(credentialCalls.at(-1), ['MAIL_ASSISTANT_PASSWORD__work', 'work-secret'], 'per-account credential reference');

// --- removing an account edits the list but keeps the password
const before = credentialCalls.length;
await act(async () => { await buttonByText('删除账户').props.onClick(); });
await act(async () => { await saveButton().props.onClick(); });
assert.equal(JSON.parse(config.accounts).length, 1);
assert.equal(credentialCalls.length, before, 'removing an account never deletes credentials');
renderer.unmount();
console.log('Settings repeated-save and multi-account tests passed.');
