// Browser half: registration, assistant rendering, mail reader, interactions,
// Remote mount/stale-response handling, and graceful degradation.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TestRenderer, { act } from 'react-test-renderer';

let factory;
let moduleId;
globalThis.window = { __ModuleLoader__: { load: (spec) => { moduleId = spec.id; factory = spec.factory; } } };
globalThis.document = { querySelector: () => ({}), createElement: () => ({ dataset: {}, textContent: '' }), head: { appendChild() {} } };

await import('../client.js');
const module = factory((name) => { assert.equal(name, 'react'); return React; });
const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(moduleId, pkg.name);
assert.deepEqual(module.inject, ['slots', 'locale', 'remote', 'configForms']);
assert.equal(typeof module.apply, 'function');

const dicts = [];
const registrations = [];
const scopeValue = { status: 'ready', revision: 1, writable: true, value: { email: 'me@qq.com', accounts: '' } };
const scope = {
  getSnapshot: () => scopeValue,
  subscribe: () => () => {},
  set: async () => true,
  unset: async () => true,
};
const credentials = {
  describe: async (refs) => ({ ok: true, value: Object.fromEntries(refs.map((ref) => [ref, { configured: true }])) }),
  set: async () => ({ ok: true }),
  unset: async () => ({ ok: true }),
};
const baseCtx = {
  effect: (fn) => { const dispose = fn(); return dispose ?? (() => {}); },
  inject: (deps, callback) => {
    if (deps[0] === 'remote.credentials') callback({ effect: (fn) => fn(), remote: { credentials, $on: () => () => {} } });
    else callback({ effect: (fn) => fn(), settings: { configure: () => () => {} } });
    return () => {};
  },
  locale: {
    register: (ns, dictionaries) => { dicts.push({ ns, dictionaries }); return () => {}; },
    bind: (ns) => (key, vars) => {
      assert.equal(ns, 'mailAssistant');
      const dictionary = dicts.at(-1)?.dictionaries.zh ?? {};
      let text = dictionary[key] ?? key;
      for (const [name, value] of Object.entries(vars ?? {})) text = text.replace(`{${name}}`, String(value));
      return text;
    },
  },
  remote: { credentials, $mount: async () => () => {}, $on: () => () => {} },
  configForms: {
    get: () => scope,
    describe: () => ({
      getSnapshot: () => ({ view: { namespaces: [{ ns: 'mail-assistant', revision: 1 }] } }),
      subscribe: () => () => {},
      ensure: () => {},
    }),
  },
  slots: {
    inject: (_key, callback) => callback() ?? (() => {}),
    register: (options, component) => { registrations.push({ options, component }); return () => {}; },
  },
};
module.apply(baseCtx);
const zh = dicts.at(-1).dictionaries.zh;
assert.ok(zh.panelTitle.includes('邮件助手'));
assert.ok(zh.digestHint.includes('不读正文'));
assert.ok(zh.draftsNotSent.includes('不发送'));
assert.ok(zh.homeIntro.includes('纯文本'));

const sidebar = registrations.find((entry) => entry.options.name === 'sidebar.panellist');
const main = registrations.find((entry) => entry.options.name === 'main');
const settings = registrations.find((entry) => entry.options.name === 'settings.section');
assert.ok(sidebar && main && settings);
assert.equal(sidebar.options.label(), '邮件助手');

const glyph = renderToStaticMarkup(React.createElement(sidebar.component, { size: 20, active: true }));
assert.ok(glyph.startsWith('<svg'));

// ---------------------------------------------------------------- rendering
const render = (data, actions = {}) => {
  const props = main.options.inject();
  const workbench = { getSnapshot: () => data, subscribe: () => () => {}, actions };
  return renderToStaticMarkup(React.createElement(main.component, { ...props, workbench }));
};

const digestValue = {
  folder: 'INBOX', since: '2026-01-01', scanned: 8, unread: 1, total: 42,
  needsAttention: [{ uid: 7, subject: '项目周报', from: 'boss@work.example', date: '2026-01-01', reason: '未读且提到日期「本周五」' }],
  important: [{ uid: 8, subject: '会议注册确认', from: 'events@example.com', date: '2026-01-01' }],
  deadlines: [{ uid: 7, subject: '项目周报', date: '2026-01-01', text: '本周五', confidence: 'inferred' }],
  suggestions: ['先处理项目周报。'],
  notice: '本地规则摘要：只分析主题、发件人和已读状态。',
};
const baseData = {
  service: 'ready',
  accountId: 'default',
  accounts: { status: 'ready', list: [{ id: 'default', email: 'me@example.com', configured: true }, { id: 'work', email: 'work@example.com', configured: false }] },
  connection: { status: 'connected', imap: 'ok', smtp: 'ok', testedAt: '2026-01-02T03:04:05.000Z' },
  overview: { status: 'ready' },
  stats: { status: 'ready', value: { unread: 3, today: 5, attention: 1, total: 42, scope: 'INBOX 共 42 封', computedAt: '2026-01-02T03:04:05.000Z' } },
  digest: { status: 'ready', value: digestValue },
  digestDays: 7,
  recent: { status: 'ready', refreshedAt: '2026-01-02T03:05:05.000Z', total: 42, folder: 'INBOX', limit: 8, items: [
    { uid: 7, subject: '真实主题 <safe>', from: 'boss@work.example', date: '2026-01-01', seen: false, category: 'work' },
    { uid: 8, subject: '已读邮件', from: 'noreply@github.com', date: '2026-01-01', seen: true, category: 'notification' },
  ] },
};

const home = render(baseData);
for (const expected of [
  '邮件简报', 'me@example.com', '已连接', '未读', '待我处理', '建议回复',
  '项目周报', '本周五', '先处理项目周报', '生成 AI 简报', '搜索邮件', '起草邮件', '浏览邮件',
  '发送前', '确认',
]) assert.ok(home.includes(expected), `home shows ${expected}`);
assert.ok(!home.includes('真实主题'), 'home is not an inbox list');

const empty = render({ service: 'ready', accounts: { status: 'ready', list: [] } });
assert.ok(empty.includes('先连接一个邮箱'));
assert.ok(empty.includes('设置路径'));

const unknown = render({});
assert.ok(unknown.includes('配置不完整'));
assert.ok(!unknown.includes('已连接'), 'unknown is never shown as connected');

const failed = render({
  service: 'ready',
  accounts: { status: 'ready', list: [{ id: 'default', email: 'me@example.com', configured: true }] },
  connection: { status: 'failed', imap: 'failed', smtp: 'ok' },
  stats: { status: 'error' },
  recent: { status: 'error' },
});
assert.ok(failed.includes('邮箱需要处理'));
assert.ok(failed.includes('连接失败'));

const noPassword = render({
  service: 'ready',
  accounts: { status: 'ready', list: [{ id: 'default', email: 'me@example.com', configured: false }] },
  connection: { status: 'incomplete', imap: 'incomplete', smtp: 'incomplete' },
});
assert.ok(noPassword.includes('未保存密码'));

const overviewFailed = render({ ...baseData, digest: null, overview: { status: 'error' } });
assert.ok(overviewFailed.includes('加载失败'));
assert.ok(overviewFailed.includes('重试'));

// ------------------------------------------------------------ interactions
const interactive = {
  ...baseData,
  message: { status: 'ready', value: { uid: 7, subject: '主题 <unsafe>', from: 'Boss <boss@work.example>', to: 'me@example.com', cc: '', date: '2026-01-01T00:00:00.000Z', text: `#outlook a {\n  padding: 0;\n}\nbody {\n  margin: 0;\n}\n正文\n第二行\n${'长'.repeat(2600)}`, truncated: true, attachments: [{ index: 1, filename: 'report.pdf', size: 2048 }] } },
  savedFiles: [{ filename: 'report.pdf', path: '/tmp/report.pdf', size: 2048 }],
  search: null,
  drafts: { status: 'ready', list: [{ id: 'draft-1', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', status: 'saved', source: 'manual', accountId: 'default', to: 'a@example.com', cc: '', bcc: '', subject: '草稿主题', body: '草稿正文', html: '', attachments: [], inReplyTo: '' }] },
  log: { status: 'ready', entries: [{ at: '2026-01-02T00:00:00.000Z', action: 'mail_list', ok: true, accountId: 'default', detail: 'INBOX 2/42' }] },
};
let live = interactive;
const listeners = new Set();
const update = (patch) => {
  live = { ...live, ...patch };
  for (const listener of listeners) listener();
};
const calls = [];
const actions = {
  init: async () => { calls.push(['init']); },
  overview: async () => { calls.push(['overview']); },
  refresh: async () => { calls.push(['refresh']); },
  stats: async (options) => { calls.push(['stats', options]); },
  checkConnection: async () => { calls.push(['check']); },
  selectAccount: async (id) => { calls.push(['select', id]); update({ accountId: id }); },
  read: async (uid) => { calls.push(['read', uid]); },
  search: async (form) => {
    calls.push(['search', form.query]);
    update({ search: { status: 'ready', value: { source: 'header_scan', matches: 1, scanned: 100, notice: '仅扫描最近 100 封', messages: [] } } });
  },
  digest: async (days) => { calls.push(['digest', days]); update({ digestDays: days, aiBrief: { status: 'idle' } }); },
  aiBrief: async (days) => {
    calls.push(['aiBrief', days]);
    const value = { generatedAt: '2026-01-02T00:00:00.000Z', provider: 'test', model: 'model', days: days || 7, scanned: 20, read: 2, summary: '本周有一封需要回复的邮件。', items: [{ uid: 7, subject: '项目周报', from: 'boss@work.example', kind: 'reply', why: '需要确认时间', deadline: '本周五', confidence: 'inferred' }], actions: ['确认参会时间'], notice: '测试简报', partial: true };
    update({ aiBrief: { status: 'ready', value } });
    return value;
  },
  loadDrafts: async () => { calls.push(['drafts']); },
  createDraft: async (form) => {
    calls.push(['createDraft', form.subject]);
    const value = { id: 'draft-new', createdAt: '2026-01-02T01:00:00.000Z', updatedAt: '2026-01-02T01:00:00.000Z', status: 'saved', source: 'manual', accountId: 'default', to: form.to.join(', '), cc: '', bcc: '', subject: form.subject, body: form.body, html: '', attachments: [], inReplyTo: '' };
    update({ drafts: { status: 'ready', list: [value, ...live.drafts.list] } });
    return value;
  },
  updateDraft: async (form) => {
    calls.push(['updateDraft', form.id]);
    const old = live.drafts.list.find((draft) => draft.id === form.id);
    const value = { ...old, updatedAt: '2026-01-02T02:00:00.000Z', to: form.to.join(', '), subject: form.subject, body: form.body };
    update({ drafts: { status: 'ready', list: live.drafts.list.map((draft) => draft.id === form.id ? value : draft) } });
    return value;
  },
  deleteDraft: async (id) => {
    calls.push(['deleteDraft', id]);
    update({ drafts: { status: 'ready', list: live.drafts.list.filter((draft) => draft.id !== id) } });
    return true;
  },
  createReplyDraft: async (uid) => {
    calls.push(['createReplyDraft', uid]);
    return { id: 'draft-reply', createdAt: '2026-01-02T03:00:00.000Z', updatedAt: '2026-01-02T03:00:00.000Z', status: 'saved', source: 'reply', accountId: 'default', to: 'boss@work.example', cc: '', bcc: '', subject: 'Re: 主题', body: '回复正文', html: '', attachments: [], inReplyTo: '<m1>' };
  },
  loadLog: async () => { calls.push(['log']); },
  saveAttachment: async (uid, index) => { calls.push(['save', uid, index]); },
  clearSearch: () => { calls.push(['clearSearch']); update({ search: null }); },
  closeMessage: () => { calls.push(['close']); update({ message: null }); },
};
let renderer;
await act(async () => {
  renderer = TestRenderer.create(React.createElement(main.component, {
    ...main.options.inject(),
    workbench: {
      getSnapshot: () => live,
      subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
      actions,
    },
  }));
});
const treeText = () => JSON.stringify(renderer.toJSON());
const textOf = (node) => {
  const children = node.props.children;
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.filter((child) => typeof child === 'string').join('');
  return '';
};
const buttonByText = (text) => renderer.root.findAll((node) => node.type === 'button' && textOf(node) === text)[0];
const findButtonContaining = (text) => renderer.root.findAll((node) => node.type === 'button' && textOf(node).includes(text))[0];

// The assistant is the default view and includes the brief, not the inbox.
assert.ok(treeText().includes('邮件简报'));
assert.ok(treeText().includes('项目周报'));

await act(async () => { await buttonByText('测试连接').props.onClick(); });
assert.deepEqual(calls.at(-1), ['check']);

// Mail is a deliberate second view: list + reader, escaped, with safe controls.
await act(async () => { buttonByText('邮件').props.onClick(); });
assert.ok(treeText().includes('真实主题'));
assert.ok(treeText().includes('主题 <unsafe>'));
assert.ok(treeText().includes('正文'));
assert.ok(!treeText().includes('#outlook a'), 'reader removes leaked template CSS');
assert.ok(treeText().includes('report.pdf'));
const mailRowButton = renderer.root.findAll((node) => node.type === 'button' && node.props.className === 'ma-mailItemRow')[0];
await act(async () => { await mailRowButton.props.onClick(); });
assert.ok(calls.some((entry) => entry[0] === 'read' && entry[1] === 7));
await act(async () => { await buttonByText('保存').props.onClick(); });
assert.ok(calls.some((entry) => entry[0] === 'save' && entry[1] === 7 && entry[2] === 1));
await act(async () => { await findButtonContaining('展开全文').props.onClick(); });

// Refresh and search live inside the Mail view, not on the assistant home.
await act(async () => { await buttonByText('刷新邮件').props.onClick(); });
assert.ok(calls.some((entry) => entry[0] === 'refresh'));
const queryInput = renderer.root.findAll((node) => node.type === 'input' && node.props['aria-label'] === '关键词')[0];
await act(async () => { queryInput.props.onChange({ target: { value: '周报' } }); });
const searchForm = renderer.root.findAll((node) => node.type === 'form' && node.props.className === 'ma-searchForm')[0];
await act(async () => { await searchForm.props.onSubmit({ preventDefault() {} }); });
assert.ok(calls.some((entry) => entry[0] === 'search' && entry[1] === '周报'));
assert.ok(treeText().includes('清除搜索'));
await act(async () => { await buttonByText('清除搜索').props.onClick(); });
assert.ok(calls.some((entry) => entry[0] === 'clearSearch'));

// Account switching and digest range are explicit controls.
const accountSelect = renderer.root.findAll((node) => node.type === 'select' && node.props['aria-label'] === '账户')[0];
await act(async () => { accountSelect.props.onChange({ target: { value: 'work' } }); });
assert.deepEqual(calls.at(-1), ['select', 'work']);
await act(async () => { buttonByText('助手').props.onClick(); });
const rangeSelect = renderer.root.findAll((node) => node.type === 'select' && node.props.className === 'ma-inlineSelect' && node.props.value === '7')[0];
await act(async () => { rangeSelect.props.onChange({ target: { value: '30' } }); });
assert.ok(calls.some((entry) => entry[0] === 'digest' && entry[1] === 30));

// Drafts and activity are secondary surfaces, never the landing page.
await act(async () => { buttonByText('草稿').props.onClick(); });
assert.ok(treeText().includes('草稿主题'));
await act(async () => { findButtonContaining('新建邮件').props.onClick(); });
assert.ok(treeText().includes('保存草稿'));
const draftSubject = renderer.root.findAll((node) => node.type === 'input' && node.props['aria-label'] === '主题')[0];
const draftBody = renderer.root.findAll((node) => node.type === 'textarea' && node.props['aria-label'] === '正文')[0];
const draftTo = renderer.root.findAll((node) => node.type === 'input' && node.props['aria-label'] === '收件人')[0];
await act(async () => {
  draftSubject.props.onChange({ target: { value: '新草稿主题' } });
  draftBody.props.onChange({ target: { value: '新草稿正文' } });
  draftTo.props.onChange({ target: { value: 'b@example.com' } });
});
await act(async () => { await buttonByText('保存草稿').props.onClick(); });
assert.ok(calls.some((entry) => entry[0] === 'createDraft' && entry[1] === '新草稿主题'));
assert.ok(treeText().includes('新草稿主题'));
await act(async () => { findButtonContaining('返回草稿列表').props.onClick(); });
await act(async () => { buttonByText('记录').props.onClick(); });
assert.ok(treeText().includes('mail_list'));
await act(async () => { buttonByText('助手').props.onClick(); });
assert.ok(treeText().includes('邮件简报'));
await act(async () => { await findButtonContaining('生成 AI 简报').props.onClick(); });
assert.ok(calls.some((entry) => entry[0] === 'aiBrief'));
assert.ok(treeText().includes('本周有一封需要回复的邮件'));

// A first visit to Drafts/Activity must request data, not claim it failed.
update({ drafts: {}, log: {} });
await act(async () => { buttonByText('草稿').props.onClick(); await Promise.resolve(); });
assert.ok(calls.some((entry) => entry[0] === 'drafts'));
assert.ok(treeText().includes('加载中'));
await act(async () => { buttonByText('记录').props.onClick(); await Promise.resolve(); });
assert.ok(calls.some((entry) => entry[0] === 'log'));
assert.ok(treeText().includes('加载中'));
renderer.unmount();

// ------------------------------------------------------- protocol lifecycle
const { TYPERT_REMOTE } = await import('../lib/remote.js');
let contribution;
let scopeListener;
let disposed = false;
let resolveList;
let holdList = false;
const apiCalls = [];
const listResult = { ok: true, value: { folder: 'INBOX', total: 1, messages: [{ uid: 1, subject: 'initial', from: 'f', date: '', size: 0, seen: false, category: 'other' }] } };
const api = {
  accounts: async () => ({ ok: true, value: { defaultId: 'default', accounts: [{ id: 'default', email: 'me@example.com', configured: true }] } }),
  overview: async () => ({ ok: true, value: {
    folder: 'INBOX', days: 7,
    stats: { folder: 'INBOX', unread: 1, today: 1, attention: 0, total: 1, computedAt: '2026-01-01T00:00:00.000Z', scope: 's' },
    digest: { folder: 'INBOX', since: '', scanned: 0, unread: 0, total: 0, needsAttention: [], important: [], deadlines: [], suggestions: [], notice: 'n' },
    recent: [{ uid: 1, subject: 'initial', from: 'f', date: '', size: 0, seen: false, category: 'other' }],
  } }),
  list: (args) => {
    apiCalls.push(['list', args]);
    if (!holdList) return Promise.resolve(listResult);
    return new Promise((resolve) => { resolveList = resolve; });
  },
  stats: async () => ({ ok: true, value: { folder: 'INBOX', unread: 1, today: 1, attention: 0, total: 1, computedAt: '2026-01-01T00:00:00.000Z', scope: 's' } }),
  checkConnection: async () => ({ ok: true, value: { accountId: 'default', email: 'me@example.com', status: 'tested', imap: { ok: true, status: 'ok' }, smtp: { ok: false, status: 'failed' } } }),
  read: async (args) => ({ ok: true, value: { uid: args.uid, subject: 's', from: 'f', to: '', cc: '', date: '', text: 'body', truncated: false, attachments: [] } }),
  search: async () => ({ ok: true, value: { folder: 'INBOX', matches: 0, source: 'server', messages: [] } }),
  digest: async () => ({ ok: true, value: { folder: 'INBOX', since: '', scanned: 0, unread: 0, total: 0, needsAttention: [], important: [], deadlines: [], suggestions: [], notice: 'n' } }),
  saveAttachments: async () => ({ ok: true, value: { dir: '/tmp', saved: [] } }),
  drafts: async () => ({ ok: true, value: { drafts: [] } }),
  log: async () => ({ ok: true, value: { entries: [] } }),
};
const protocolRegs = [];
const protocolEffects = [];
const protocolCtx = {
  effect: (fn) => { const cleanup = fn(); if (typeof cleanup === 'function') protocolEffects.push(cleanup); return cleanup; },
  inject: (deps, callback) => {
    if (deps[0] === 'remote.mailAssistant') callback({ remote: { mailAssistant: api } });
    else callback({ effect: (fn) => fn(), remote: { credentials, $on: () => () => {} } });
    return () => {};
  },
  locale: baseCtx.locale,
  remote: { credentials, $mount: async (info) => { contribution = info; return () => { disposed = true; }; }, $on: () => () => {} },
  configForms: { ...baseCtx.configForms, get: () => ({ ...scope, subscribe: (fn) => { scopeListener = fn; return () => {}; } }) },
  slots: { inject: (_key, cb) => cb(), register: (options, component) => { protocolRegs.push({ options, component }); } },
};
module.apply(protocolCtx);
await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
assert.ok(contribution, 'shared contribution mounted');
assert.deepEqual(contribution.descriptors.map((descriptor) => descriptor.id).sort(), Object.keys(TYPERT_REMOTE.methods).map((key) => `${pkg.name}#${key}`).sort());
const workbench = protocolRegs.find((entry) => entry.options.name === 'main').options.inject().workbench;
assert.equal(workbench.getSnapshot().service, 'ready');
await act(async () => { await workbench.actions.init(); });
assert.equal(workbench.getSnapshot().accounts.list.length, 1);
assert.equal(workbench.getSnapshot().recent.items[0].subject, 'initial');
assert.equal(workbench.getSnapshot().overview.status, 'ready');
await act(async () => { await workbench.actions.checkConnection(); });
assert.equal(workbench.getSnapshot().connection.status, 'failed');
assert.equal(workbench.getSnapshot().connection.testedAt !== undefined, true);
holdList = true;
const pending = workbench.actions.refresh();
assert.equal(workbench.getSnapshot().recent.status, 'loading');
scopeListener(); // configuration changed while the list request was in flight
resolveList({ ok: true, value: { folder: 'INBOX', total: 1, messages: [{ uid: 1, subject: 'stale', from: 'f', date: '', size: 0, seen: false, category: 'other' }] } });
await pending;
assert.equal(workbench.getSnapshot().recent.items, undefined, 'stale account response is discarded');
holdList = true;
const next = workbench.actions.refresh();
resolveList({ ok: true, value: { folder: 'INBOX', total: 1, messages: [{ uid: 2, subject: 'fresh', from: 'f', date: '', size: 0, seen: false, category: 'other' }] } });
await next;
holdList = false;
assert.equal(workbench.getSnapshot().recent.items[0].subject, 'fresh');
await act(async () => { await workbench.actions.search({ query: 'x', unreadOnly: true }); });
assert.equal(workbench.getSnapshot().search.status, 'ready');
await act(async () => { await workbench.actions.digest(30); });
assert.equal(workbench.getSnapshot().digest.status, 'ready');
await act(async () => { await workbench.actions.loadDrafts(); });
assert.equal(workbench.getSnapshot().drafts.status, 'ready');
protocolEffects.forEach((dispose) => dispose());
assert.ok(disposed, 'mount is disposed with the plugin');

// ------------------------------------------------------------- degradation
registrations.length = 0;
assert.doesNotThrow(() => module.apply({
  effect: (fn) => { try { fn(); } catch { /* ignore */ } },
  inject: () => () => {},
  locale: { register: () => () => {}, bind: () => (key) => key },
  remote: { credentials: undefined },
  configForms: { get: () => undefined, describe: () => { throw new Error('no mirror'); } },
  slots: { inject: (_key, callback) => callback(), register: (options, component) => { registrations.push({ options, component }); return () => {}; } },
}));
assert.equal(registrations.length, 3, 'registrations survive a degraded runtime');

console.log('All client-half registration, render, interaction and lifecycle tests passed.');
