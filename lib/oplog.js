// Small in-memory operation log. Deliberately stores no bodies, addresses, or
// attachment contents: only the action name, outcome, account id, and a short
// human detail line.
const DEFAULT_LIMIT = 100;
const DETAIL_LIMIT = 200;

export function createOperationLog({ limit = DEFAULT_LIMIT } = {}) {
  const entries = [];
  const cap = Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 500) : DEFAULT_LIMIT;
  return {
    record({ action, ok = true, accountId = '', detail = '' } = {}) {
      const cleanAction = typeof action === 'string' ? action.slice(0, 64) : 'operation';
      const cleanDetail = typeof detail === 'string' ? detail.replace(/\s+/g, ' ').trim().slice(0, DETAIL_LIMIT) : '';
      entries.unshift({
        at: new Date().toISOString(),
        action: cleanAction,
        ok: ok === true,
        accountId: typeof accountId === 'string' ? accountId.slice(0, 64) : '',
        detail: cleanDetail,
      });
      if (entries.length > cap) entries.length = cap;
      return entries[0];
    },
    list() {
      return entries.slice();
    },
    clear() {
      entries.length = 0;
    },
  };
}
