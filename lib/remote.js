// Public Typert contribution shared by the Host and an explicitly mounting Client.
// Contract is intentionally small and read-mostly: nothing here can send mail.
// Sending always goes through the agent tool approval flow.
import { z } from 'zod';
import { createTypertRemoteInfo } from '@deepseek-ai/dsh-typert-protocol/remote-info';

const packageName = '@zhanghonghu13/dsh-mail-assistant';

const folderField = z.string().max(1024).optional();
const accountId = z.string().max(64).optional();
const addressField = z.array(z.string().max(320)).max(50).optional();
const draftBody = z.string().max(20000).optional();
const draftHtml = z.string().max(50000).optional();

const messageSummary = z.object({
  uid: z.number().int(),
  subject: z.string(),
  from: z.string(),
  date: z.string(),
  size: z.number().int(),
  seen: z.boolean(),
  category: z.enum(['work', 'notification', 'personal', 'promotion', 'other']),
});

const protocolStatus = z.object({
  ok: z.boolean(),
  status: z.enum(['ok', 'failed', 'incomplete', 'unavailable']),
});

const argsSchemas = {
  checkConnection: z.strictObject({ accountId }),
  list: z.strictObject({ accountId, folder: folderField, limit: z.number().int().min(1).max(50).optional() }),
  read: z.strictObject({
    accountId, uid: z.number().int().positive().max(4294967295), folder: folderField,
    maxChars: z.number().int().min(500).max(500000).optional(),
  }),
  search: z.strictObject({
    accountId, folder: folderField, query: z.string().max(512).optional(), from: z.string().max(512).optional(),
    to: z.string().max(512).optional(), since: z.string().max(32).optional(), before: z.string().max(32).optional(),
    unreadOnly: z.boolean().optional(), limit: z.number().int().min(1).max(50).optional(),
    category: z.enum(['work', 'notification', 'personal', 'promotion', 'other']).optional(),
  }),
  stats: z.strictObject({
    accountId, folder: folderField, localDate: z.string().max(32).optional(),
    localOffsetMinutes: z.number().int().min(-840).max(840).optional(),
    days: z.number().int().min(1).max(90).optional(),
  }),
  digest: z.strictObject({ accountId, folder: folderField, days: z.number().int().min(1).max(90).optional(), limit: z.number().int().min(1).max(200).optional() }),
  overview: z.strictObject({
    accountId, folder: folderField, days: z.number().int().min(1).max(90).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    localDate: z.string().max(32).optional(), localOffsetMinutes: z.number().int().min(-840).max(840).optional(),
  }),
  aiBrief: z.strictObject({
    accountId, folder: folderField, days: z.number().int().min(1).max(90).optional(),
    maxBodies: z.number().int().min(1).max(15).optional(),
  }),
  saveAttachments: z.strictObject({
    accountId, uid: z.number().int().positive().max(4294967295), folder: folderField,
    indices: z.array(z.number().int().min(1)).max(50).optional(),
  }),
  accounts: z.strictObject({}),
  log: z.strictObject({}),
  drafts: z.strictObject({ accountId }),
  draftCreate: z.strictObject({
    accountId, to: addressField, cc: addressField, bcc: addressField,
    subject: z.string().max(400).optional(), body: draftBody, html: draftHtml,
  }),
  draftUpdate: z.strictObject({
    id: z.string().min(1).max(128), to: addressField, cc: addressField, bcc: addressField,
    subject: z.string().max(400).optional(), body: draftBody, html: draftHtml,
    status: z.enum(['saved', 'review']).optional(),
  }),
  draftDelete: z.strictObject({ id: z.string().min(1).max(128) }),
  draftReply: z.strictObject({
    accountId, folder: folderField, uid: z.number().int().positive().max(4294967295), body: draftBody,
  }),
};

const statsSchema = z.object({
  folder: z.string(), unread: z.number().int(), today: z.number().int(), attention: z.number().int(),
  total: z.number().int(), computedAt: z.string(), scope: z.string(),
});

const digestSchema = z.object({
  folder: z.string(), since: z.string(), scanned: z.number().int(), unread: z.number().int(), total: z.number().int(),
  needsAttention: z.array(z.object({ uid: z.number().int(), subject: z.string(), from: z.string(), date: z.string(), reason: z.string() })),
  important: z.array(z.object({ uid: z.number().int(), subject: z.string(), from: z.string(), date: z.string() })),
  deadlines: z.array(z.object({
    uid: z.number().int(), subject: z.string(), date: z.string(), text: z.string(),
    confidence: z.enum(['explicit', 'inferred']),
  })),
  suggestions: z.array(z.string()),
  notice: z.string(),
});

const draftSchema = z.object({
  id: z.string(), createdAt: z.string(), updatedAt: z.string(), status: z.enum(['saved', 'review']),
  source: z.enum(['manual', 'reply', 'forward', 'ai']), accountId: z.string(),
  to: z.string(), cc: z.string(), bcc: z.string(), subject: z.string(), body: z.string(), html: z.string(),
  attachments: z.array(z.object({ filename: z.string(), size: z.number().int() })),
  inReplyTo: z.string(),
});

const resultSchemas = {
  checkConnection: z.object({
    accountId: z.string(), email: z.string(),
    status: z.enum(['tested', 'incomplete', 'unavailable']),
    imap: protocolStatus, smtp: protocolStatus,
  }),
  list: z.object({ folder: z.string(), total: z.number().int(), messages: z.array(messageSummary) }),
  read: z.object({
    uid: z.number().int(), subject: z.string(), from: z.string(), to: z.string(), cc: z.string(),
    date: z.string(), text: z.string(), truncated: z.boolean(),
    attachments: z.array(z.object({ index: z.number().int(), filename: z.string(), size: z.number().int() })),
  }),
  search: z.object({
    folder: z.string(), matches: z.number().int(), source: z.enum(['server', 'header_scan']),
    scanned: z.number().int().optional(), notice: z.string().optional(),
    messages: z.array(messageSummary),
  }),
  stats: statsSchema,
  digest: digestSchema,
  overview: z.object({
    folder: z.string(), days: z.number().int(),
    stats: statsSchema, digest: digestSchema,
    recent: z.array(messageSummary),
  }),
  aiBrief: z.object({
    generatedAt: z.string(), provider: z.string(), model: z.string(), days: z.number().int(),
    scanned: z.number().int(), read: z.number().int(), summary: z.string(),
    items: z.array(z.object({
      uid: z.number().int(), subject: z.string(), from: z.string(),
      kind: z.enum(['reply', 'todo', 'info']), why: z.string(), deadline: z.string(),
      confidence: z.enum(['explicit', 'inferred', 'unknown']),
    })),
    actions: z.array(z.string()), notice: z.string(), partial: z.boolean(),
  }),
  saveAttachments: z.object({
    dir: z.string(),
    saved: z.array(z.object({ filename: z.string(), path: z.string(), size: z.number().int() })),
  }),
  accounts: z.object({
    defaultId: z.string(),
    accounts: z.array(z.object({
      id: z.string(), email: z.string(), senderName: z.string(), imapHost: z.string(), smtpHost: z.string(),
      isDefault: z.boolean(), configured: z.boolean(), downloadDirConfigured: z.boolean(),
    })),
  }),
  log: z.object({
    entries: z.array(z.object({
      at: z.string(), action: z.string(), ok: z.boolean(), accountId: z.string(), detail: z.string(),
    })),
  }),
  drafts: z.object({ drafts: z.array(draftSchema) }),
  draftCreate: draftSchema,
  draftUpdate: draftSchema,
  draftDelete: z.object({ id: z.string(), deleted: z.boolean() }),
  draftReply: draftSchema,
};

const codec = (schema, symbol) => ({ mode: 'strict', typeSymbol: `${packageName}#${symbol}`, create: () => schema });
const methods = {};
for (const name of Object.keys(resultSchemas)) {
  // accounts/log take no input; everything else receives one validated object.
  const noArgs = name === 'accounts' || name === 'log';
  const input = argsSchemas[name];
  methods[`mailAssistant/${name}`] = {
    service: 'mailAssistant',
    invocation: { kind: 'direct' },
    parameters: noArgs ? [] : [{ name: 'args', source: 'json', codec: codec(input, `${name}:args`), strictCodec: codec(input, `${name}:args`) }],
    result: codec(resultSchemas[name], `${name}:result`),
  };
}

export const TYPERT_REMOTE = createTypertRemoteInfo({ package: packageName, methods }, z);
