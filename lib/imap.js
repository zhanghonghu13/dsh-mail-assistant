// Minimal IMAP4rev1 client over implicit TLS for the Mail Assistant plugin.
// Supports: LOGIN, SELECT, SEARCH, FETCH (envelope and full body), LOGOUT.
// Never intended as a general-purpose IMAP library.

import tls from 'node:tls';
import { decodeHeaderWords } from './mime.js';

const LITERAL_END = /\{(\d+)\}$/;

// RFC 2971 client identification. NetEase (163/126/yeah) answers
// "NO SELECT Unsafe Login" until the client identifies itself after LOGIN.
const CLIENT_ID = {
  name: 'dsh-mail-assistant',
  version: '1.0.0',
  vendor: 'DeepSeek Harness',
  'support-url': 'https://github.com/zhanghonghu13/dsh-mail-assistant',
};

/** Quote an IMAP string argument (atoms keep it simple; this is not airtight for exotic hosts). */
function quoteString(value) {
  const text = String(value);
  if (/[\r\n\0]/.test(text)) throw new ImapError('IMAP 参数含有非法控制字符');
  return `"${text.replace(/([\\"])/g, '\\$1')}"`;
}

class ImapError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImapError';
  }
}

/**
 * Tokenizer over a response stream made of text lines interleaved with literals.
 * Produces a flat token list: atoms, quoted strings, parentheses, and literal markers.
 */
class TokenStream {
  constructor(parts) {
    this.parts = parts; // [{ text: string } | { literal: Buffer }]
    this.pi = 0; // part index
    this.ci = 0; // char index within the current text part
  }

  peekChar() {
    while (this.pi < this.parts.length) {
      const part = this.parts[this.pi];
      if (part.literal !== undefined) return null;
      if (this.ci < part.text.length) return part.text[this.ci];
      this.pi += 1;
      this.ci = 0;
    }
    return undefined;
  }

  next() {
    while (this.pi < this.parts.length) {
      const part = this.parts[this.pi];
      if (part.literal !== undefined) {
        this.pi += 1;
        this.ci = 0;
        return { type: 'literal', value: part.literal };
      }
      const text = part.text;
      while (this.ci < text.length) {
        const ch = text[this.ci];
        if (ch === ' ') { this.ci += 1; continue; }
        if (ch === '(') { this.ci += 1; return { type: 'lparen', value: '(' }; }
        if (ch === ')') { this.ci += 1; return { type: 'rparen', value: ')' }; }
        if (ch === '"') {
          let value = '';
          this.ci += 1;
          while (this.ci < text.length) {
            const c = text[this.ci];
            if (c === '\\' && this.ci + 1 < text.length) { value += text[this.ci + 1]; this.ci += 2; continue; }
            if (c === '"') { this.ci += 1; break; }
            value += c;
            this.ci += 1;
          }
          return { type: 'string', value };
        }
        let value = '';
        while (this.ci < text.length) {
          const c = text[this.ci];
          if (c === ' ' || c === '(' || c === ')') break;
          value += c;
          this.ci += 1;
        }
        return { type: 'atom', value };
      }
      this.pi += 1;
      this.ci = 0;
    }
    return null;
  }
}

/** Parse a parenthesized IMAP response list into nested arrays; literals become {literal} objects. */
function parseParenList(stream) {
  const list = [];
  for (;;) {
    const token = stream.next();
    if (token === null) return list;
    if (token.type === 'rparen') return list;
    if (token.type === 'lparen') {
      list.push(parseParenList(stream));
      continue;
    }
    if (token.type === 'literal') {
      list.push({ literal: token.value });
      continue;
    }
    list.push(token.type === 'string' || token.type === 'atom' ? token.value : token.value);
  }
}

/** Extract a text value from a list item; literals decode as UTF-8 and RFC 2047 words are decoded. */
function itemText(item) {
  if (item === null || item === undefined || item === 'NIL') return '';
  if (typeof item === 'string') return decodeHeaderWords(item);
  if (item && item.literal !== undefined) return decodeHeaderWords(item.literal.toString('utf-8'));
  return '';
}

/** Convert an IMAP envelope address group into {name, address} objects. */
function parseAddressGroup(group) {
  if (!Array.isArray(group)) return [];
  return group
    .filter(Array.isArray)
    .map((entry) => ({
      name: itemText(entry[0]),
      address: [itemText(entry[2]), itemText(entry[3])].filter(Boolean).join('@'),
    }));
}

/** Read an IMAP response from a FETCH group (line + literal parts) into a structured record. */
function parseFetchRecord(parts) {
  const stream = new TokenStream(parts);
  // Skip the leading "* <seq> FETCH" atoms.
  for (let i = 0; i < 3; i += 1) {
    const token = stream.next();
    if (token === null) return {};
  }
  const body = stream.next();
  if (body === null || body.type !== 'lparen') return {};
  const record = {};
  let token;
  while ((token = stream.next()) !== null && token.type !== 'rparen') {
    if (token.type === 'atom') {
      const key = token.value.toUpperCase();
      const valueToken = stream.next();
      if (valueToken === null) break;
      if (valueToken.type === 'lparen') {
        record[key] = parseParenList(stream);
      } else if (valueToken.type === 'literal') {
        record[key] = { literal: valueToken.value };
      } else if (valueToken.type === 'string') {
        record[key] = valueToken.value;
      } else {
        record[key] = valueToken.value === 'NIL' ? null : valueToken.value;
      }
    }
  }
  return record;
}

/** Turn a parsed FETCH record with ENVELOPE into a message summary. */
function envelopeToSummary(record, size) {
  const envelope = Array.isArray(record.ENVELOPE) ? record.ENVELOPE : [];
  const subject = itemText(envelope[1]);
  const flags = Array.isArray(record.FLAGS)
    ? record.FLAGS.map((flag) => (typeof flag === 'string' ? flag : ''))
    : [];
  return {
    uid: typeof record.UID === 'string' || typeof record.UID === 'number' ? Number(record.UID) : undefined,
    subject,
    from: parseAddressGroup(envelope[2]),
    sender: parseAddressGroup(envelope[3])[0] ?? null,
    to: parseAddressGroup(envelope[5]),
    cc: parseAddressGroup(envelope[6]),
    date: itemText(envelope[0]),
    messageId: itemText(envelope[8]),
    size,
    seen: flags.some((flag) => /\\Seen/i.test(flag)),
  };
}

/** Test/diagnostic access to the response parsers. */
export const parserInternals = {
  TokenStream,
  parseParenList,
  parseFetchRecord,
  parseAddressGroup,
  envelopeToSummary,
};

export class ImapClient {
  constructor({ host, port, user, password, timeoutMs = 30000 }) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.timeoutMs = timeoutMs;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.waiters = [];
    this.tag = 0;
    this.closed = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: this.host,
        port: this.port,
        servername: this.host,
        timeout: this.timeoutMs,
      });
      this.socket = socket;
      const fail = (error) => { this.closed = true; socket.destroy(); reject(error); };
      socket.once('error', fail);
      socket.once('timeout', () => fail(new ImapError(`连接 ${this.host}:${this.port} 超时`)));
      socket.on('data', (chunk) => this.#feed(chunk));
      socket.once('close', () => this.#handleDisconnect());
      socket.once('secureConnect', () => {
        this.#readLine().then((line) => {
          if (line === null || !/^\*\s+(OK|PREAUTH)/i.test(line)) {
            fail(new ImapError(`IMAP 服务器问候异常：${line ?? '(连接已断开)'}`));
            return;
          }
          socket.off('error', fail);
          socket.on('error', () => this.#handleDisconnect());
          resolve();
        }).catch(fail);
      });
    });
  }

  #feed(chunk) {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
    this.#drain();
  }

  #handleDisconnect() {
    this.closed = true;
    // Consume complete buffered lines first, then fail what cannot complete.
    this.#drain();
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      if (waiter.want === 'line') waiter.resolve(null);
      else waiter.reject(new ImapError('IMAP 连接已断开'));
    }
    this.waiters = [];
  }

  #drain() {
    while (this.waiters.length > 0) {
      const waiter = this.waiters[0];
      const result = this.#trySatisfy(waiter);
      if (result === undefined) return;
      this.waiters.shift();
      clearTimeout(waiter.timer);
      if (result === null) waiter.reject(new ImapError('IMAP 连接已断开'));
      else waiter.resolve(result);
    }
  }

  #trySatisfy(waiter) {
    if (waiter.want === 'line') {
      const index = this.buffer.indexOf('\r\n');
      if (index === -1) {
        if (this.closed) return null;
        return undefined;
      }
      const line = this.buffer.subarray(0, index).toString('binary');
      this.buffer = this.buffer.subarray(index + 2);
      return line;
    }
    // want: 'literal'
    if (this.buffer.length < waiter.size) {
      if (this.closed) return null;
      return undefined;
    }
    const data = this.buffer.subarray(0, waiter.size);
    this.buffer = this.buffer.subarray(waiter.size);
    return data;
  }

  #readLine() {
    if (this.waiters.length > 0) return Promise.reject(new ImapError('IMAP 内部错误：并发读取'));
    return new Promise((resolve, reject) => {
      const waiter = { want: 'line', resolve, reject, timer: setTimeout(() => {
        this.waiters = this.waiters.filter((entry) => entry !== waiter);
        reject(new ImapError('IMAP 读取超时'));
      }, this.timeoutMs) };
      this.waiters.push(waiter);
      if (this.closed) {
        this.#drain();
        if (this.waiters.includes(waiter)) {
          this.waiters = this.waiters.filter((entry) => entry !== waiter);
          clearTimeout(waiter.timer);
          resolve(null);
        }
        return;
      }
      this.#drain();
    });
  }

  #readLiteral(size) {
    return new Promise((resolve, reject) => {
      const waiter = { want: 'literal', size, resolve, reject, timer: setTimeout(() => {
        this.waiters = this.waiters.filter((entry) => entry !== waiter);
        reject(new ImapError('IMAP 读取超时'));
      }, this.timeoutMs) };
      this.waiters.push(waiter);
      this.#drain();
    });
  }

  async #readLineWithLiteral() {
    const line = await this.#readLine();
    if (line === null) return { line: null, literal: null };
    const match = LITERAL_END.exec(line);
    if (match === null) return { line, literal: null };
    const literal = await this.#readLiteral(Number(match[1]));
    return { line: line.slice(0, match.index), literal };
  }

  #send(text) {
    if (this.closed) throw new ImapError('IMAP 连接已关闭');
    this.socket.write(`${text}\r\n`);
  }

  /**
   * Run one command and collect untagged response groups until the tagged line.
   * Each group is a list of parts: [{text} | {literal}] — one leading line plus
   * literal/continuation pairs for FETCH responses.
   */
  async #command(command, { collect = true } = {}) {
    this.tag += 1;
    const tag = `A${String(this.tag).padStart(3, '0')}`;
    this.#send(`${tag} ${command}`);
    const groups = [];
    for (;;) {
      const { line, literal } = await this.#readLineWithLiteral();
      if (line === null) throw new ImapError('IMAP 连接在命令执行中断开');
      if (line.startsWith(`${tag} `)) {
        const status = line.slice(tag.length + 1);
        if (/^OK/i.test(status)) return { ok: true, status, groups };
        throw new ImapError(`IMAP 命令失败：${status}`);
      }
      if (!collect) continue;
      if (line.startsWith('*')) {
        const parts = [{ text: line }];
        if (literal !== null) parts.push({ literal });
        groups.push(parts);
      } else if (groups.length > 0 && line !== '') {
        // Continuation of a literal-bearing response group.
        const target = groups.at(-1);
        target.push({ text: ` ${line}` });
        if (literal !== null) target.push({ literal });
      }
    }
  }

  async login() {
    await this.#command(`LOGIN ${quoteString(this.user)} ${quoteString(this.password)}`);
    await this.#identify();
  }

  /**
   * Announce the client per RFC 2971. Optional for most servers, mandatory in
   * practice for NetEase: without it SELECT fails with "Unsafe Login".
   * A rejection means the server has no ID support, so it must not fail login.
   */
  async #identify() {
    const params = Object.entries(CLIENT_ID)
      .map(([key, value]) => `${quoteString(key)} ${quoteString(value)}`)
      .join(' ');
    try {
      await this.#command(`ID (${params})`);
    } catch {
      // Servers without the ID extension answer BAD; log in anyway.
    }
  }

  async select(mailbox) {
    const { groups } = await this.#command(`SELECT ${quoteString(mailbox)}`);
    const state = { exists: 0, uidValidity: 0, recent: 0 };
    for (const parts of groups) {
      const text = parts[0].text;
      let match = /^\*\s+(\d+)\s+EXISTS/i.exec(text);
      if (match) { state.exists = Number(match[1]); continue; }
      match = /^\*\s+OK\s+\[UIDVALIDITY\s+(\d+)\]/i.exec(text);
      if (match) state.uidValidity = Number(match[1]);
      match = /^\*\s+(\d+)\s+RECENT/i.exec(text);
      if (match) state.recent = Number(match[1]);
    }
    return state;
  }

  async searchUid(criteria) {
    const { groups } = await this.#command(`UID SEARCH ${criteria}`);
    const uids = [];
    let sawSearch = false;
    for (const parts of groups) {
      const match = /^\*\s+SEARCH(?:\s+(.*))?$/i.exec(parts[0].text);
      if (!match) continue;
      sawSearch = true;
      const values = (match[1] ?? '').trim();
      if (!values) continue;
      for (const token of values.split(/\s+/)) {
        const uid = Number(token);
        if (!/^[1-9]\d*$/.test(token) || !Number.isSafeInteger(uid) || uid > 0xffffffff) {
          throw new ImapError('IMAP 协议错误：SEARCH 响应含有无效的 UID');
        }
        uids.push(uid);
      }
    }
    if (!sawSearch) throw new ImapError('IMAP 协议错误：UID SEARCH 完成但没有 SEARCH 响应');
    return uids;
  }

  /** Fetch envelopes by sequence number or UID; returns summaries in ascending order. */
  async fetchEnvelopes(sequenceSet, { byUid = false } = {}) {
    const { groups } = await this.#command(
      `${byUid ? 'UID ' : ''}FETCH ${sequenceSet} (UID FLAGS RFC822.SIZE ENVELOPE)`,
    );
    const summaries = [];
    for (const parts of groups) {
      if (!/^\*\s+\d+\s+FETCH\s/i.test(parts[0].text)) continue;
      const record = parseFetchRecord(parts);
      const seqMatch = /^\*\s+(\d+)/.exec(parts[0].text);
      const summary = envelopeToSummary(record, Number(record['RFC822.SIZE']) || 0);
      summary.seq = seqMatch ? Number(seqMatch[1]) : undefined;
      summaries.push(summary);
    }
    summaries.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    return summaries;
  }

  /** Fetch one message by UID and return its raw bytes. */
  async fetchRawByUid(uid) {
    const { groups } = await this.#command(`UID FETCH ${uid} (UID RFC822.SIZE BODY.PEEK[])`);
    for (const parts of groups) {
      const literal = parts.find((part) => part.literal !== undefined)?.literal;
      if (literal !== undefined) return literal;
      // Some servers stream the body as BODY[] in a literal-bearing FETCH; check other shapes.
      const record = parseFetchRecord(parts);
      if (record['BODY[]'] && record['BODY[]'].literal !== undefined) return record['BODY[]'].literal;
    }
    throw new ImapError(`未找到 UID ${uid} 对应的邮件`);
  }

  async logout() {
    if (this.closed) return;
    try {
      await this.#command('LOGOUT', { collect: false });
    } catch {
      // Logout failures never propagate.
    }
    this.close();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    if (this.socket) this.socket.destroy();
  }
}
