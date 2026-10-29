// Reply/forward draft construction. These helpers only build text and headers;
// nothing here sends mail.
const RE_PREFIX = /^\s*((re|aw|回复)\s*[:：]\s*)+/i;
const FWD_PREFIX = /^\s*((fwd|fw|转发)\s*[:：]\s*)+/i;

export function replySubject(subject) {
  const value = typeof subject === 'string' ? subject.trim() : '';
  if (value === '') return 'Re:';
  return RE_PREFIX.test(value) ? value : `Re: ${value}`;
}

export function forwardSubject(subject) {
  const value = typeof subject === 'string' ? subject.trim() : '';
  if (value === '') return 'Fwd:';
  return FWD_PREFIX.test(value) ? value : `Fwd: ${value}`;
}

const MAX_QUOTE_CHARS = 20000;

export function quoteBody(text) {
  const body = typeof text === 'string' ? text.slice(0, MAX_QUOTE_CHARS) : '';
  return body
    .split(/\r?\n/)
    .map((line) => (line === '' ? '>' : `> ${line}`))
    .join('\n');
}

function describeOriginal({ from = [], to = [], date = '', subject = '' } = {}) {
  const addresses = (list) => (Array.isArray(list) ? list : [])
    .map((entry) => (entry?.name ? `${entry.name} <${entry.address}>` : entry?.address))
    .filter(Boolean).join(', ');
  return [
    '---------- 原始邮件 ----------',
    `发件人：${addresses(from) || '(未知)'}`,
    `收件人：${addresses(to) || '(未知)'}`,
    `日期：${date || '(未知)'}`,
    `主题：${subject || '(无主题)'}`,
    '',
  ].join('\n');
}

/** Build the reply body, quoting the original with a standard header block. */
export function replyBody({ body = '', original }) {
  const lead = typeof body === 'string' ? body.trim() : '';
  const quoted = quoteBody(original?.text ?? '');
  return [lead, describeOriginal(original), quoted].filter((part) => part !== '').join('\n\n');
}

/** Build the forwarded body: new text plus the original text and headers. */
export function forwardBody({ body = '', original }) {
  const lead = typeof body === 'string' ? body.trim() : '';
  const text = typeof original?.text === 'string' ? original.text.slice(0, MAX_QUOTE_CHARS) : '';
  return [lead, describeOriginal(original) + text].filter((part) => part !== '').join('\n\n');
}

/** Recipients for a reply, excluding the account itself. */
export function replyRecipients({ original, selfEmail, replyAll = false }) {
  const self = String(selfEmail || '').toLowerCase();
  const unique = (list) => {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter((entry) => {
      const address = String(entry?.address || '').toLowerCase();
      if (!address.includes('@') || address === self || seen.has(address)) return false;
      seen.add(address);
      return true;
    });
  };
  const to = unique(original?.from);
  if (!replyAll) return { to, cc: [] };
  const sender = new Set(to.map((entry) => String(entry.address).toLowerCase()));
  const cc = unique([...(original?.to ?? []), ...(original?.cc ?? [])])
    .filter((entry) => !sender.has(String(entry.address).toLowerCase()));
  return { to, cc };
}

/** Merge an existing References chain with the message being replied to. */
export function replyReferences({ references = '', messageId = '' }) {
  const chain = String(references || '').split(/\s+/).filter((token) => token.startsWith('<') && token.endsWith('>'));
  const id = String(messageId || '').trim();
  if (id !== '' && !chain.includes(id)) chain.push(id);
  return chain.slice(-20).join(' ');
}
