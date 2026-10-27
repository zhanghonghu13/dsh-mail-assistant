// Minimal MIME parser and message builder for the Mail Assistant plugin.
// Best-effort parsing: malformed input never throws; it degrades to partial text.

/** Decode a Buffer into text using the declared charset with sensible fallbacks. */
export function decodeCharset(buffer, charset) {
  const label = String(charset || '').trim().toLowerCase() || 'utf-8';
  const candidates = [label];
  if (!/^utf-?8$/.test(label)) {
    candidates.push('utf-8');
    if (/^(gb|big5|hz|iso-2022-cn)/.test(label)) candidates.push('gb18030');
    if (label === 'gb18030') candidates.push('gbk');
    candidates.push('windows-1252');
  }
  for (const candidate of candidates) {
    try {
      return new TextDecoder(candidate, { fatal: true }).decode(buffer);
    } catch {
      // try the next candidate
    }
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

/** Decode base64 / quoted-printable / passthrough encodings to a Buffer. */
export function decodeTransfer(buffer, encoding) {
  const label = String(encoding || '').trim().toLowerCase();
  if (label === 'base64') {
    const text = buffer.toString('binary').replace(/[^A-Za-z0-9+/=]/g, '');
    try {
      return Buffer.from(text, 'base64');
    } catch {
      return buffer;
    }
  }
  if (label === 'quoted-printable') {
    const text = buffer.toString('binary');
    const out = Buffer.alloc(text.length);
    let w = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === '=') {
        const hex = text.slice(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
          out[w] = parseInt(hex, 16);
          i += 2;
          w += 1;
          continue;
        }
        if (hex.startsWith('\r\n')) { i += 2; continue; }
      }
      out[w] = text.charCodeAt(i) & 0xff;
      w += 1;
    }
    return out.subarray(0, w);
  }
  return buffer;
}

/** Decode RFC 2047 encoded words (=?charset?B|Q?data?=) inside a header value. */
export function decodeHeaderWords(value) {
  if (typeof value !== 'string') return value == null ? '' : String(value);
  if (!value.includes('=?')) return value;
  return value.replace(/=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g, (whole, charset, encoding, data) => {
    let buffer;
    if (encoding.toLowerCase() === 'b') {
      buffer = Buffer.from(data, 'base64');
    } else {
      const soft = decodeTransfer(Buffer.from(data.replace(/_/g, ' '), 'binary'), 'quoted-printable');
      buffer = soft;
    }
    return decodeCharset(buffer, charset).replace(/\r?\n/g, '');
  }).replace(/\?=\s+=\?/g, '?==?');
}

/** Unfold and split a raw header block into {name, value} pairs (no decoding). */
export function parseHeaderBlock(block) {
  const text = block.toString('binary');
  const lines = text.split(/\r?\n/);
  const headers = [];
  let current = null;
  for (const line of lines) {
    if (/^[ \t]/.test(line) && current) {
      current.value += ` ${line.replace(/^[ \t]+/, '')}`;
      continue;
    }
    const separator = line.indexOf(':');
    if (separator > 0) {
      current = { name: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
      headers.push(current);
    }
  }
  return headers;
}

/** Case-insensitive header lookup in a parsed header list. */
export function findHeader(headers, name) {
  const lower = name.toLowerCase();
  return headers.find((header) => header.name.toLowerCase() === lower)?.value;
}

/** Parse an RFC 5322 address list header into {name, address} objects. */
export function parseAddressList(value) {
  if (!value) return [];
  const decoded = decodeHeaderWords(value);
  const result = [];
  const groups = decoded.split(',').map((part) => part.trim()).filter(Boolean);
  for (const group of groups) {
    const match = group.match(/^(.*?)<([^>]*)>\s*$/);
    if (match) {
      const name = match[1].trim().replace(/^"(.*)"$/, '$1').trim();
      result.push({ name, address: match[2].trim() });
    } else if (group.includes('@')) {
      result.push({ name: '', address: group });
    }
  }
  return result;
}

/** Parse a Content-Type (or Content-Disposition) value into {value, params}. */
export function parseContentType(raw) {
  const text = String(raw || '');
  const semicolon = text.indexOf(';');
  const value = (semicolon === -1 ? text : text.slice(0, semicolon)).trim().toLowerCase();
  const params = {};
  const rest = semicolon === -1 ? '' : text.slice(semicolon + 1);
  const pattern = /([A-Za-z0-9_*-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^;\s]+))/g;
  let match;
  while ((match = pattern.exec(rest)) !== null) {
    const rawKey = match[1].toLowerCase();
    // RFC 2231 extended parameters (key*) fold into the base parameter name.
    const key = rawKey.endsWith('*') ? rawKey.slice(0, -1) : rawKey;
    const val = match[2] !== undefined
      ? decodeHeaderWords(match[2].replace(/\\(.)/g, '$1'))
      : decodeHeaderWords(match[3]).trim();
    // RFC 2231 charset'language'continuation → fold into one value.
    const extended = /^([A-Za-z0-9_-]+)'([A-Za-z0-9_-]*)'(.*)$/.exec(val);
    params[key] = extended ? decodeURIComponent(extended[3]) : val;
  }
  return { value: value || 'text/plain', params };
}

/** Convert a decoded HTML body into readable plain text. */
export function htmlToText(html) {
  let text = html
    .replace(/<script[\sS]*?<\/script>/gi, '')
    .replace(/<style[\sS]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '');
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  text = text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (whole, name) => entities[name.toLowerCase()] ?? whole);
  return text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

function boundarySplit(buffer, boundary) {
  const marker = Buffer.from(`--${boundary}`, 'binary');
  const positions = [];
  let start = 0;
  while (start <= buffer.length - marker.length) {
    const index = buffer.indexOf(marker, start, 'binary');
    if (index === -1) break;
    // Boundary delimiters must start a line.
    const atLineStart = index === 0 || buffer[index - 1] === 0x0a;
    if (atLineStart) positions.push(index);
    start = index + marker.length;
  }
  const parts = [];
  for (let i = 0; i < positions.length - 1; i += 1) {
    const from = positions[i] + marker.length;
    const isFinal = buffer[from] === 0x2d && buffer[from + 1] === 0x2d; // "--"
    if (isFinal) break;
    const to = positions[i + 1];
    let part = buffer.subarray(from, to);
    // Strip the CRLF that precedes the boundary delimiter.
    if (part.at(-2) === 0x0d && part.at(-1) === 0x0a) part = part.subarray(0, part.length - 2);
    else if (part.at(-1) === 0x0a) part = part.subarray(0, part.length - 1);
    // Strip the CRLF that follows the delimiter.
    if (part.at(0) === 0x0d && part.at(1) === 0x0a) part = part.subarray(2);
    else if (part.at(0) === 0x0a) part = part.subarray(1);
    parts.push(part);
  }
  return parts;
}

/**
 * Parse one MIME node (headers + body) into {contentType, headers, text, html, attachments}.
 * Never throws; failures degrade to empty text and fewer attachments.
 */
export function parseMimeNode(raw, depth = 0) {
  const result = { headers: [], text: '', html: '', attachments: [] };
  let headerEnd = raw.indexOf('\r\n\r\n');
  let sepLength = 4;
  if (headerEnd === -1) { headerEnd = raw.indexOf('\n\n'); sepLength = 2; }
  if (headerEnd === -1) return result;
  const headerBlock = raw.subarray(0, headerEnd);
  let body = raw.subarray(headerEnd + sepLength);
  const headers = parseHeaderBlock(headerBlock);
  result.headers = headers;
  const typeHeader = findHeader(headers, 'Content-Type') || 'text/plain; charset=utf-8';
  const { value: contentType, params } = parseContentType(typeHeader);
  const transferEncoding = findHeader(headers, 'Content-Transfer-Encoding') || '';
  if (contentType.startsWith('multipart/') && params.boundary && depth < 12) {
    const subParts = boundarySplit(body, params.boundary);
    for (const subPart of subParts) {
      const child = parseMimeNode(subPart, depth + 1);
      if (child.text) result.text = result.text || child.text;
      if (child.html) result.html = result.html || child.html;
      result.attachments.push(...child.attachments);
    }
    return result;
  }
  if (/^message\/rfc822$/i.test(contentType) && depth < 12) {
    const child = parseMimeNode(body, depth + 1);
    if (child.text) result.text = result.text || child.text;
    if (child.html) result.html = result.html || child.html;
    result.attachments.push(...child.attachments);
    return result;
  }
  const decoded = decodeTransfer(body, transferEncoding);
  const dispositionHeader = findHeader(headers, 'Content-Disposition') || '';
  const disposition = parseContentType(dispositionHeader);
  const filename = disposition.params.filename
    ?? params.name
    ?? decodeHeaderWords(disposition.params.filename || params.name || '');
  const isAttachment = /attachment/i.test(disposition.value)
    || (filename && !/^text\//i.test(contentType))
    || (/^image\//i.test(contentType) && !!filename);
  if (isAttachment) {
    result.attachments.push({
      filename: filename || 'attachment',
      contentType,
      size: decoded.length,
      data: decoded,
    });
    return result;
  }
  if (/^text\/plain/i.test(contentType) || /^text$/i.test(contentType)) {
    result.text = decodeCharset(decoded, params.charset);
    return result;
  }
  if (/^text\/html/i.test(contentType)) {
    result.html = decodeCharset(decoded, params.charset);
    return result;
  }
  if (/^text\//i.test(contentType)) {
    result.text = decodeCharset(decoded, params.charset);
  }
  return result;
}

/**
 * Parse a complete raw RFC 822 message into a summary object.
 * Returns subject, addresses, date, text/html bodies, and attachments.
 */
export function parseMessage(raw) {
  const node = parseMimeNode(raw);
  const headers = node.headers;
  const dateValue = findHeader(headers, 'Date');
  const parsedDate = dateValue ? new Date(decodeHeaderWords(dateValue)) : undefined;
  return {
    messageId: findHeader(headers, 'Message-ID') || '',
    inReplyTo: findHeader(headers, 'In-Reply-To') || '',
    subject: decodeHeaderWords(findHeader(headers, 'Subject') || ''),
    from: parseAddressList(findHeader(headers, 'From')),
    to: parseAddressList(findHeader(headers, 'To')),
    cc: parseAddressList(findHeader(headers, 'Cc')),
    date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : '',
    text: node.text || (node.html ? htmlToText(node.html) : ''),
    html: node.html,
    attachments: node.attachments.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
      data: attachment.data,
    })),
  };
}

/** RFC 2047 encode a header value when it contains non-ASCII characters. */
export function encodeHeaderValue(value) {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const encoded = Buffer.from(value, 'utf-8').toString('base64');
  return `=?utf-8?B?${encoded}?=`;
}

function encodeFilenameParam(filename) {
  if (/^[\x20-\x7e]+$/.test(filename)) return `filename="${filename.replace(/(["\\])/g, '\\$1')}"`;
  const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `filename*=UTF-8''${encoded}`;
}

/**
 * Build a complete outgoing MIME message.
 * to/cc are arrays of {name?, address}; attachments: {filename, contentType, data: Buffer}.
 * Returns the raw message Buffer ready for SMTP DATA.
 */
export function buildMessage({ fromAddress, fromName, to, cc = [], subject, text, html = '', attachments = [] }) {
  const format = (list) => list
    .map((entry) => (entry.name ? `${encodeHeaderValue(entry.name)} <${entry.address}>` : entry.address))
    .join(', ');
  const headerLines = [];
  const fromDisplay = fromName ? `${encodeHeaderValue(fromName)} <${fromAddress}>` : fromAddress;
  headerLines.push(`From: ${fromDisplay}`);
  headerLines.push(`To: ${format(to)}`);
  if (cc.length > 0) headerLines.push(`Cc: ${format(cc)}`);
  headerLines.push(`Subject: ${encodeHeaderValue(subject)}`);
  headerLines.push(`Date: ${new Date().toUTCString().replace(/GMT/, '+0000')}`);
  const domain = fromAddress.split('@')[1] || 'localhost';
  headerLines.push(`Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`);
  headerLines.push('MIME-Version: 1.0');

  const encodeBody = (content, type) => ({
    headerLines: [
      `Content-Type: ${type}; charset=utf-8`,
      'Content-Transfer-Encoding: base64',
    ],
    data: Buffer.from(content, 'utf-8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
  });

  const textPart = encodeBody(text, 'text/plain');
  const htmlPart = html ? encodeBody(html, 'text/html') : null;
  const hasAlternative = !!html && !!text;
  const hasAttachments = attachments.length > 0;

  const attachmentPart = (attachment) => {
    const encoded = attachment.data.toString('base64').replace(/(.{76})/g, '$1\r\n');
    return [
      `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name=${JSON.stringify(/^[\x20-\x7e]+$/.test(attachment.filename) ? attachment.filename : 'attachment')}`,
      `Content-Disposition: attachment; ${encodeFilenameParam(attachment.filename)}`,
      'Content-Transfer-Encoding: base64',
      '',
      encoded,
    ].join('\r\n');
  };

  let contentTypeLine;
  let body;
  if (hasAlternative && hasAttachments) {
    const altBoundary = `----=_Part_${Date.now()}_alt`;
    const mixedBoundary = `----=_Part_${Date.now()}_mix`;
    const alternativeBody = [
      `--${altBoundary}`,
      ...textPart.headerLines,
      '',
      textPart.data,
      '',
      `--${altBoundary}`,
      ...htmlPart.headerLines,
      '',
      htmlPart.data,
      '',
      `--${altBoundary}--`,
      '',
    ].join('\r\n');
    contentTypeLine = `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`;
    body = [
      `--${mixedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      '',
      alternativeBody,
      '',
      ...attachments.flatMap((attachment) => [`--${mixedBoundary}`, attachmentPart(attachment), '']),
      `--${mixedBoundary}--`,
      '',
    ].join('\r\n');
  } else if (hasAttachments) {
    const mixedBoundary = `----=_Part_${Date.now()}_mix`;
    contentTypeLine = `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`;
    body = [
      `--${mixedBoundary}`,
      ...textPart.headerLines,
      '',
      textPart.data,
      '',
      ...attachments.flatMap((attachment) => [`--${mixedBoundary}`, attachmentPart(attachment), '']),
      `--${mixedBoundary}--`,
      '',
    ].join('\r\n');
  } else if (hasAlternative) {
    const altBoundary = `----=_Part_${Date.now()}_alt`;
    contentTypeLine = `Content-Type: multipart/alternative; boundary="${altBoundary}"`;
    body = [
      `--${altBoundary}`,
      ...textPart.headerLines,
      '',
      textPart.data,
      '',
      `--${altBoundary}`,
      ...htmlPart.headerLines,
      '',
      htmlPart.data,
      '',
      `--${altBoundary}--`,
      '',
    ].join('\r\n');
  } else {
    const headerBlock = [...headerLines, ...textPart.headerLines].join('\r\n');
    return Buffer.from(`${headerBlock}\r\n\r\n${textPart.data}\r\n`, 'utf-8');
  }
  const headerBlock = [...headerLines, contentTypeLine].join('\r\n');
  return Buffer.from(`${headerBlock}\r\n\r\n${body}`, 'utf-8');
}
