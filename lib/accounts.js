// Account parsing and credential-reference naming.
//
// The plugin keeps a small account list in the `accounts` config field as JSON.
// When that field is empty (or unusable) the legacy single-account fields are
// used, so existing installations keep working unchanged. Passwords never live
// in config: each account maps to one credential-store reference.
export const LEGACY_PASSWORD_REF = 'MAIL_ASSISTANT_PASSWORD';
export const DEFAULT_ACCOUNT_ID = 'default';
export const MAX_ACCOUNTS = 8;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function passwordRefFor(id) {
  return id === DEFAULT_ACCOUNT_ID ? LEGACY_PASSWORD_REF : `${LEGACY_PASSWORD_REF}__${id}`;
}

function text(value, max = 1024) {
  const out = typeof value === 'string' ? value.trim() : '';
  // Control characters would end up in IMAP/SMTP commands or headers.
  return /[\r\n\0]/.test(out) ? '' : out.slice(0, max);
}

function port(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(65535, Math.max(1, Math.round(n)));
}

/** Normalize one stored account; returns null when it is unusable. */
export function normalizeAccount(raw, index = 0) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const email = text(raw.email, 320).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return null;
  const candidate = text(raw.id, 32) || `account${index + 1}`;
  if (!ID_PATTERN.test(candidate)) return null;
  return {
    id: candidate,
    email,
    senderName: text(raw.senderName, 200),
    imapHost: text(raw.imapHost, 255),
    imapPort: port(raw.imapPort),
    smtpHost: text(raw.smtpHost, 255),
    smtpPort: port(raw.smtpPort),
    downloadDir: text(raw.downloadDir, 1024),
  };
}

/** Read the configured account list, falling back to the legacy single account. */
export function parseAccounts(rawAccounts, legacy = {}) {
  let stored = [];
  if (typeof rawAccounts === 'string' && rawAccounts.trim() !== '') {
    try {
      const parsed = JSON.parse(rawAccounts);
      if (Array.isArray(parsed)) stored = parsed;
    } catch {
      stored = []; // Corrupt JSON must not break the plugin; legacy config still applies.
    }
  }
  let accounts = stored
    .slice(0, MAX_ACCOUNTS)
    .map((entry, index) => normalizeAccount(entry, index))
    .filter((entry) => entry !== null);
  if (accounts.length === 0) {
    const single = normalizeAccount({ ...legacy, id: DEFAULT_ACCOUNT_ID }, 0);
    accounts = single === null ? [] : [single];
  }
  const ids = new Set();
  accounts = accounts.filter((account) => {
    if (ids.has(account.id)) return false;
    ids.add(account.id);
    return true;
  });
  return accounts;
}

/** Pick the requested account, or the first configured one. */
export function pickAccount(accounts, requestedId) {
  if (!Array.isArray(accounts) || accounts.length === 0) return null;
  if (typeof requestedId !== 'string' || requestedId === '') return accounts[0];
  return accounts.find((account) => account.id === requestedId) ?? null;
}

/** Stored shape for the settings page (no secrets). */
export function accountToStored(account) {
  return {
    id: account.id,
    email: account.email,
    senderName: account.senderName,
    imapHost: account.imapHost,
    imapPort: account.imapPort || 0,
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort || 0,
    downloadDir: account.downloadDir,
  };
}
