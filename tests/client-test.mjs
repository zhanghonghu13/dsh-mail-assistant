// Loads the browser half with a mock module loader and the real React, then
// verifies its registrations (sidebar glyph, main panel, settings section) and
// renders both pages to static markup.
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const registrations = [];
const effects = [];
const localeDicts = [];
const remoteOn = [];
const describeCalls = [];
const resolvedNamespaces = [];

let factory;
let moduleId;
globalThis.window = {
  __ModuleLoader__: {
    load: (spec) => {
      moduleId = spec.id;
      factory = spec.factory;
    },
  },
};

globalThis.document = {
  querySelector: () => ({}), // Pretend the style tag already exists.
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: () => {} },
};

await import('../client.js');
assert.equal(typeof factory, 'function', 'client module registered its factory');

// The browser module id must equal the installed package name, or the client
// module graph cannot resolve the entry (import failed / duplicate factory).
const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(moduleId, pkg.name, 'client module id matches package name');

const module = factory((name) => {
  if (name === 'react') return React;
  throw new Error(`unexpected require: ${name}`);
});
assert.equal(typeof module.apply, 'function');
assert.ok(Array.isArray(module.inject));
assert.deepEqual(module.inject, ['slots', 'locale', 'remote', 'configForms']);

const scope = {
  getSnapshot: () => ({ status: 'ready', value: { email: 'me@qq.com', imapHost: '', smtpHost: '', imapPort: 0, smtpPort: 0 }, revision: 1, writable: true }),
  subscribe: () => () => {},
  set: async () => true,
  unset: async () => true,
};

const mockCtx = {
  effect: (fn) => { effects.push(fn); const dispose = fn(); return dispose ?? (() => {}); },
  inject: (deps, callback) => {
    assert.deepEqual(deps, ['remote.credentials']);
    callback({ effect: (fn) => { const dispose = fn(); return dispose ?? (() => {}); }, remote: mockCtx.remote });
    return () => {};
  },
  locale: {
    register: (ns, dicts) => { localeDicts.push({ ns, dicts }); return () => {}; },
    bind: (ns) => (key, vars) => {
      assert.equal(ns, 'mailAssistant');
      const dict = localeDicts.at(-1)?.dicts.zh ?? {};
      let text = dict[key] ?? key;
      for (const [name, value] of Object.entries(vars ?? {})) text = text.replace(`{${name}}`, String(value));
      return text;
    },
  },
  remote: {
    $on: (name, listener) => { remoteOn.push({ name, listener }); return () => {}; },
    credentials: {
      describe: async (refs) => {
        describeCalls.push(refs);
        return { MAIL_ASSISTANT_PASSWORD: { configured: true, writable: true } };
      },
      set: async () => {},
      unset: async () => {},
    },
  },
  configForms: {
    get: (id) => {
      // Accept a composition-prefixed entry id; this mock serves "include:mail-assistant".
      assert.ok(id === 'mail-assistant' || id === 'include:mail-assistant', `unexpected namespace: ${id}`);
      resolvedNamespaces.push(id);
      return scope;
    },
    describe: () => ({
      getSnapshot: () => ({ view: { writable: true, namespaces: [{ ns: 'include:mail-assistant', revision: 1 }] } }),
      subscribe: () => () => {},
      ensure: () => {},
    }),
  },
  slots: {
    inject: (key, callback) => {
      const dispose = callback();
      return dispose ?? (() => {});
    },
    register: (options, component) => {
      registrations.push({ options, component });
      return () => {};
    },
  },
};

await module.apply(mockCtx);

// --- Dictionaries for both languages.
const dict = localeDicts[0];
assert.equal(dict.ns, 'mailAssistant');
assert.ok(dict.dicts.en.panelLabel && dict.dicts.zh.panelLabel);
assert.ok(dict.dicts.zh.panelTitle.includes('邮件助手'));
assert.ok(dict.dicts.zh.settingsLabel);

// --- Three registrations: sidebar glyph, main panel, settings section.
assert.equal(registrations.length, 3);
const sidebar = registrations.find((entry) => entry.options.name === 'sidebar.panellist');
const main = registrations.find((entry) => entry.options.name === 'main');
const settings = registrations.find((entry) => entry.options.name === 'settings.section');

assert.ok(sidebar, 'sidebar glyph registered');
assert.equal(sidebar.options.id, 'mail-assistant');
assert.equal(sidebar.options.label(), '邮件助手');
assert.equal(typeof sidebar.component, 'function');

assert.ok(main, 'main panel registered');
assert.equal(main.options.key, 'mail-assistant');
const mainProps = main.options.inject();
assert.equal(typeof mainProps.scope.getSnapshot, 'function');
assert.deepEqual(mainProps.scope.getSnapshot(), scope.getSnapshot(), 'namespace resolved from the describe mirror');
assert.ok(resolvedNamespaces.includes('include:mail-assistant'));
assert.equal(typeof mainProps.translate, 'function', 'panel receives its own translate');
assert.ok(mainProps.password && typeof mainProps.password.getSnapshot === 'function');
assert.equal(typeof main.component, 'function');

assert.ok(settings, 'settings section registered');
assert.equal(settings.options.id, 'mail-assistant');
assert.equal(settings.options.label(), '邮件助手');
const settingsProps = settings.options.inject();
assert.equal(typeof settingsProps.scope.getSnapshot, 'function');
assert.equal(typeof settingsProps.translate, 'function', 'section receives its own translate');
assert.equal(typeof settingsProps.savePassword, 'function');
assert.equal(typeof settingsProps.clearPassword, 'function');
assert.equal(typeof settingsProps.refreshPassword, 'function');

// --- Credential mirror was primed through the Host remote.
assert.equal(describeCalls.length >= 1, true);
assert.deepEqual(describeCalls[0], ['MAIL_ASSISTANT_PASSWORD']);
assert.deepEqual(remoteOn.map((entry) => entry.name), ['credentials/reference-updated']);

// --- Real-render the settings section with ONLY the injected props the real
//     shell provides (no framework `t`): every control must be visible.
const translate = (key) => dict.dicts.zh[key] ?? key;
const sectionMarkup = renderToStaticMarkup(React.createElement(settings.component, { ...settingsProps }));
for (const expected of ['邮箱地址', '专用密码', 'IMAP 服务器', 'SMTP 服务器', '附件保存目录', '保存', 'me@qq.com']) {
  assert.ok(sectionMarkup.includes(expected), `settings page shows "${expected}"`);
}
assert.ok(sectionMarkup.includes('type="password"'), 'password input rendered');
assert.ok(sectionMarkup.includes('type="email"'), 'email input rendered');

// --- Real-render the main panel.
const panelMarkup = renderToStaticMarkup(React.createElement(main.component, { ...mainProps }));
for (const expected of ['邮件助手', '已配置邮箱', 'me@qq.com', '你可以这样说', '每一封外发邮件都会先请你确认']) {
  assert.ok(panelMarkup.includes(expected), `panel shows "${expected}"`);
}

// --- Real-render the sidebar glyph.
const glyphMarkup = renderToStaticMarkup(React.createElement(sidebar.component, { size: 20, active: true }));
assert.ok(glyphMarkup.startsWith('<svg'), 'glyph renders an svg');
assert.ok(glyphMarkup.includes('currentColor'));

// --- Degraded runtime: no credentials namespace and no $on must not throw.
registrations.length = 0;
const degradedCtx = {
  effect: (fn) => { try { fn(); } catch { /* ignore */ } },
  locale: { register: () => () => {}, bind: () => (key) => key },
  remote: { credentials: undefined },
  configForms: { get: () => undefined },
  slots: {
    inject: (_key, callback) => { callback(); },
    register: (options, component) => { registrations.push({ options, component }); return () => {}; },
  },
};
assert.doesNotThrow(() => module.apply(degradedCtx));
assert.equal(registrations.length, 3, 'registrations survive a degraded runtime');

// --- A throwing configForms.describe must not escape apply().
assert.doesNotThrow(() => module.apply({
  ...degradedCtx,
  configForms: { get: () => { throw new Error('settings unavailable'); }, describe: () => { throw new Error('no mirror'); } },
}));

console.log('All client-half registration + render tests passed.');
