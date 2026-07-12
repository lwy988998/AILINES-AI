export const ANONYMOUS_ID_STORAGE_KEY = 'ailines-anonymous-id';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createAnonymousId() {
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `anon_${randomPart}`;
}

export function getOrCreateAnonymousId() {
  if (!canUseLocalStorage()) return '';

  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY)?.trim();
    if (existing) return existing;

    const nextId = createAnonymousId();
    window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return '';
  }
}
