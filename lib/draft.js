// In-memory draft store. Drafts live in the Host process only: they expire, are
// capped, and never contain credentials. Sending a draft is a separate,
// user-approved tool call.
const MAX_DRAFTS = 20;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function clean(value, max = 20000) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function addresses(list) {
  return Array.isArray(list)
    ? list.filter((entry) => entry && typeof entry.address === 'string' && entry.address.includes('@'))
      .map((entry) => ({ name: clean(entry.name, 200), address: clean(entry.address, 320).toLowerCase() }))
    : [];
}

export function createDraftStore({ now = () => Date.now(), onChange = () => {} } = {}) {
  const drafts = new Map();
  let counter = 0;
  const changed = () => { try { onChange(); } catch { /* persistence must not break edits */ } };

  const sweep = () => {
    const cutoff = now() - DRAFT_TTL_MS;
    for (const [id, draft] of drafts) {
      if (Date.parse(draft.createdAt) < cutoff) drafts.delete(id);
    }
    while (drafts.size > MAX_DRAFTS) {
      const oldest = [...drafts.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (oldest === undefined) break;
      drafts.delete(oldest.id);
    }
  };

  const normalize = (input = {}, id, createdAt) => {
    const timestamp = new Date(now()).toISOString();
    const record = {
      id,
      createdAt,
      updatedAt: typeof input.updatedAt === 'string' && input.updatedAt !== '' ? input.updatedAt : timestamp,
      status: input.status === 'review' ? 'review' : 'saved',
      source: ['manual', 'reply', 'forward', 'ai'].includes(input.source) ? input.source : 'manual',
      accountId: clean(input.accountId, 64),
      to: addresses(input.to),
      cc: addresses(input.cc),
      bcc: addresses(input.bcc),
      subject: clean(input.subject, 400),
      body: clean(input.body),
      html: clean(input.html, 50000),
      attachmentPaths: Array.isArray(input.attachmentPaths)
        ? input.attachmentPaths.filter((entry) => typeof entry === 'string' && entry.trim() !== '').slice(0, 3)
        : [],
      forwardFrom: input.forwardFrom && Number.isInteger(input.forwardFrom.uid)
        ? { folder: clean(input.forwardFrom.folder, 1024) || 'INBOX', uid: input.forwardFrom.uid, indices: Array.isArray(input.forwardFrom.indices) ? input.forwardFrom.indices.filter((n) => Number.isInteger(n) && n > 0).slice(0, 3) : null }
        : null,
      inReplyTo: clean(input.inReplyTo, 400),
      references: clean(input.references, 2000),
    };
    return record;
  };

  return {
    create(input = {}) {
      sweep();
      counter += 1;
      const id = `draft-${now().toString(36)}-${counter}`;
      const draft = normalize(input, id, new Date(now()).toISOString());
      drafts.set(id, draft);
      sweep();
      changed();
      return draft;
    },
    get(id) {
      sweep();
      return drafts.get(String(id)) ?? null;
    },
    /** Apply a partial edit; ids, account, threading headers and creation time stay fixed. */
    update(id, patch = {}) {
      sweep();
      const key = String(id);
      const current = drafts.get(key);
      if (current === undefined) return null;
      const next = { ...current, updatedAt: new Date(now()).toISOString() };
      if (patch.to !== undefined) next.to = addresses(patch.to);
      if (patch.cc !== undefined) next.cc = addresses(patch.cc);
      if (patch.bcc !== undefined) next.bcc = addresses(patch.bcc);
      if (patch.subject !== undefined) next.subject = clean(patch.subject, 400);
      if (patch.body !== undefined) next.body = clean(patch.body);
      if (patch.html !== undefined) next.html = clean(patch.html, 50000);
      if (patch.status !== undefined) next.status = patch.status === 'review' ? 'review' : 'saved';
      if (patch.attachmentPaths !== undefined) {
        next.attachmentPaths = Array.isArray(patch.attachmentPaths)
          ? patch.attachmentPaths.filter((entry) => typeof entry === 'string' && entry.trim() !== '').slice(0, 3)
          : [];
      }
      drafts.set(key, next);
      changed();
      return next;
    },
    /** Load persisted drafts without rewriting the backing file. */
    hydrate(records) {
      drafts.clear();
      for (const record of Array.isArray(records) ? records : []) {
        if (record === null || typeof record !== 'object' || typeof record.id !== 'string') continue;
        const draft = normalize(record, record.id, typeof record.createdAt === 'string' && record.createdAt !== '' ? record.createdAt : new Date(now()).toISOString());
        drafts.set(draft.id, draft);
      }
      sweep();
    },
    list() {
      sweep();
      return [...drafts.values()].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
    },
    remove(id) {
      const removed = drafts.delete(String(id));
      if (removed) changed();
      return removed;
    },
    clear() {
      const had = drafts.size > 0;
      drafts.clear();
      if (had) changed();
    },
  };
}

export const DRAFT_LIMITS = { MAX_DRAFTS, DRAFT_TTL_MS };
