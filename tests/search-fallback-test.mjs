import assert from 'node:assert/strict';
import { runMailSearch, matchesHeaders, isNeteaseAccount } from '../lib/search.js';

const header = uid => ({ uid, subject: uid === 105 ? '年度报告' : '其他', from: [{ name: '张三', address: 'zhang@example.org' }], to: [{ name: '李四', address: 'li@example.org' }], date: 'date' });
const base = { folder: 'INBOX', limit: 20, email: 'a@163.com', criteria: 'FROM "zhang"', nonTextCriteria: '', query: '', from: 'zhang', to: '', exists: 120 };
function mock(searches, envelopes) {
  const calls = [];
  return { calls, async searchUid(criteria) { calls.push(['search', criteria]); const value = searches.shift(); if (value instanceof Error) throw value; return value; }, async fetchEnvelopes(set, options) { calls.push(['fetch', set, options]); const value = envelopes.shift(); if (value instanceof Error) throw value; return value; } };
}
assert.equal(isNeteaseAccount('user@YEAH.NET'), true);
for (const email of ['a@163.com.evil', 'a@evil163.com', 'a@126.com@evil', 'other@example.com']) assert.equal(isNeteaseAccount(email), false);
assert.equal(matchesHeaders(header(105), { query: '报告', from: 'ZHANG', to: '李四' }), true);
assert.equal(matchesHeaders(header(105), { query: '报告', from: 'zhang', to: 'missing' }), false);
assert.equal(matchesHeaders(header(105), { query: 'li@example.org' }), false); // query excludes recipient and body
{
  const c = mock([[]], []);
  const r = await runMailSearch(c, { ...base, email: 'a@example.org' });
  assert.equal(r.source, 'server'); assert.equal(c.calls.length, 1); assert.equal(r.matches, 0);
}
{
  const c = mock([[5, 10]], [[header(10), header(5)]]);
  const r = await runMailSearch(c, base);
  assert.equal(r.source, 'server'); assert.match(r.notice, /可能不完整/); assert.deepEqual(r.messages.map(x => x.uid), [10, 5]);
  assert.deepEqual(c.calls[1], ['fetch', '5,10', { byUid: true }]);
}
{
  const headers = Array.from({ length: 100 }, (_, i) => header(i + 21));
  const c = mock([[], [105, 106]], [headers]);
  const r = await runMailSearch(c, { ...base, query: '报告', to: 'li@example.org', nonTextCriteria: 'SINCE 01-Jan-2020 BEFORE 01-Jan-2021 UNSEEN' });
  assert.equal(r.source, 'header_scan'); assert.equal(r.scanned, 100); assert.equal(r.matches, 1); assert.equal(r.messages[0].uid, 105);
  assert.deepEqual(c.calls[1], ['fetch', '21:120', undefined]);
  assert.match(c.calls[2][1], /^UID 21,22,/); assert.match(c.calls[2][1], /SINCE 01-Jan-2020 BEFORE 01-Jan-2021 UNSEEN$/);
  assert.match(r.notice, /不包含正文和较早邮件/); assert.match(r.notice, /并非完整结果/);
}
{
  const c = mock([[]], []);
  const r = await runMailSearch(c, { ...base, exists: 0 });
  assert.equal(r.scanned, 0); assert.equal(r.matches, 0); assert.equal(c.calls.length, 1);
}
{
  const c = mock([[]], [[header(1)]]);
  await assert.rejects(runMailSearch(c, { ...base, exists: 2 }), /发生变化/);
}
{
  const c = mock([[], [999]], [[header(1)]]);
  await assert.rejects(runMailSearch(c, { ...base, exists: 1, nonTextCriteria: 'UNSEEN' }), /范围外/);
}
{
  const c = mock([[], new Error('offline')], [[header(1)]]);
  await assert.rejects(runMailSearch(c, { ...base, exists: 1, nonTextCriteria: 'UNSEEN' }), /offline/);
}
{
  const c = mock([[1]], [[]]);
  await assert.rejects(runMailSearch(c, base), /发生变化/);
}
{
  const c = mock([[]], []);
  const r = await runMailSearch(c, { ...base, criteria: 'UNSEEN', from: '' });
  assert.equal(r.source, 'server'); assert.equal(c.calls.length, 1);
}
console.log('Search fallback tests passed.');
