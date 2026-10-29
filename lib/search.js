// Bounded NetEase workaround. Fetch the recent sequence range as ENVELOPE only,
// then apply server-side date/unread filtering to its UID set. No body is
// downloaded and messages are not marked as read.
import { classifyMessage } from './classify.js';

export const HEADER_SCAN_LIMIT = 100;
const NETEASE_DOMAINS = new Set(['163.com', '126.com', 'yeah.net']);

export function isNeteaseAccount(email) {
  const match = /^[^@\s]+@([^@\s]+)$/.exec(email || '');
  return !!match && NETEASE_DOMAINS.has(match[1].toLowerCase());
}

function addressText(entries) {
  return (entries ?? []).map(({ name, address }) => `${name || ''} ${address || ''}`).join(' ');
}
function includes(text, term) {
  return String(text || '').toLocaleLowerCase().includes(term.toLocaleLowerCase());
}
export function matchesHeaders(summary, { query = '', from = '', to = '' }) {
  const sender = addressText(summary.from);
  return (!query || includes(summary.subject, query) || includes(sender, query)) &&
    (!from || includes(sender, from)) && (!to || includes(addressText(summary.to), to));
}
function formatAddresses(list) {
  return (list ?? []).map((entry) => entry.name ? `${entry.name} <${entry.address}>` : entry.address).join(', ');
}
function sortedUids(uids) {
  if (!Array.isArray(uids) || uids.some(uid => !Number.isSafeInteger(uid) || uid < 1 || uid > 0xffffffff)) {
    throw new Error('IMAP 搜索返回无效 UID，请重试。');
  }
  return [...new Set(uids)].sort((a, b) => a - b);
}
async function fetchSelected(client, selected) {
  if (!selected.length) return [];
  const summaries = await client.fetchEnvelopes(selected.join(','), { byUid: true });
  const expected = new Set(selected);
  const received = new Set();
  for (const summary of summaries) {
    if (!expected.has(summary.uid) || received.has(summary.uid)) {
      throw new Error('IMAP 邮件头响应与搜索 UID 不一致，请重试。');
    }
    received.add(summary.uid);
  }
  // Expunges or unsolicited/incomplete responses must not masquerade as a complete scan.
  if (received.size !== expected.size) throw new Error('搜索期间邮件发生变化或邮件头响应不完整，请重试。');
  return summaries.sort((a, b) => b.uid - a.uid);
}
function message(summary) {
  const from = formatAddresses(summary.from);
  return {
    uid: summary.uid,
    subject: summary.subject,
    from,
    date: summary.date,
    size: Number(summary.size) || 0,
    seen: summary.seen === true,
    category: classifyMessage({ subject: summary.subject, from }),
  };
}

export async function runMailSearch(client, { folder, limit, email, criteria, nonTextCriteria, query, from, to, exists }) {
  const serverUids = sortedUids(await client.searchUid(criteria));
  const textSearch = !!(query || from || to);
  const neteaseText = isNeteaseAccount(email) && textSearch;
  if (neteaseText && serverUids.length === 0) {
    if (!Number.isSafeInteger(exists) || exists < 0) throw new Error('IMAP 邮箱状态无效，请重试。');
    const first = Math.max(1, exists - HEADER_SCAN_LIMIT + 1);
    const headers = exists ? await client.fetchEnvelopes(`${first}:${exists}`) : [];
    if (headers.length !== Math.min(exists, HEADER_SCAN_LIMIT)) throw new Error('搜索期间邮箱发生变化或邮件头响应不完整，请重试。');
    const uids = sortedUids(headers.map(header => header.uid));
    if (uids.length !== headers.length) throw new Error('IMAP 邮件头响应含重复 UID，请重试。');
    // Applying IMAP criteria on the bounded UID set preserves INTERNALDATE and
    // current unread semantics without an unbounded UID SEARCH ALL result.
    let eligible = new Set(uids);
    if (uids.length && nonTextCriteria) {
      const filtered = sortedUids(await client.searchUid(`UID ${uids.join(',')} ${nonTextCriteria}`));
      if (filtered.some(uid => !eligible.has(uid))) throw new Error('IMAP 筛选返回范围外 UID，请重试。');
      eligible = new Set(filtered);
    }
    const matches = headers.filter(summary => eligible.has(summary.uid) && matchesHeaders(summary, { query, from, to }))
      .sort((a, b) => b.uid - a.uid);
    return {
      folder, source: 'header_scan', matches: matches.length, scanned: headers.length,
      notice: '仅扫描该文件夹最近最多100封邮件的头部，日期/未读条件在这100封内筛选；不包含正文和较早邮件，可能遗漏正文匹配和其他邮件。匹配数量仅为本次扫描中的数量，并非完整结果。',
      messages: matches.slice(0, limit).map(message),
    };
  }
  const headers = await fetchSelected(client, serverUids.slice(-limit));
  return {
    folder, source: 'server', matches: serverUids.length,
    ...(neteaseText ? { notice: '网易服务器文本搜索结果可能不完整。' } : {}),
    messages: headers.map(message),
  };
}
