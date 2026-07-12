import type { MockPlan } from '@/lib/mockPlan';

export type CourseHistoryMode = 'lite' | 'deep';

export type CourseHistoryItem = {
  id: string;
  goal: string;
  mode: CourseHistoryMode;
  title: string;
  href: string;
  createdAt: string;
  updatedAt: string;
  legacy?: boolean;
};

export type CourseSnapshot = {
  id: string;
  goal: string;
  mode: CourseHistoryMode;
  title: string;
  plan: MockPlan;
  createdAt: string;
  updatedAt: string;
};

export const COURSE_HISTORY_STORAGE_KEY = 'ailines-course-history';
export const COURSE_SNAPSHOTS_STORAGE_KEY = 'ailines-course-snapshots';
export const MAX_COURSE_HISTORY_ITEMS = 5;

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function normalizeCourseHistoryMode(mode?: string): CourseHistoryMode {
  return mode === 'lite' || mode === 'deep' ? mode : 'deep';
}

export function buildHistoryHref(courseId: string) {
  return `/plan?courseId=${encodeURIComponent(courseId)}`;
}

export function buildCourseHistoryHref(goal: string, mode?: string) {
  const params = new URLSearchParams({ goal: goal.trim(), mode: normalizeCourseHistoryMode(mode) });
  return `/plan?${params.toString()}`;
}

export function generateCourseId(goal: string, mode?: string) {
  const safeMode = normalizeCourseHistoryMode(mode);
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `course-${safeMode}-${randomPart}`;
}

function isCourseHistoryItem(value: unknown): value is CourseHistoryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CourseHistoryItem>;
  return typeof item.id === 'string' && typeof item.goal === 'string' && (item.mode === 'lite' || item.mode === 'deep') && typeof item.title === 'string' && typeof item.href === 'string' && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string';
}

function isSnapshot(value: unknown): value is CourseSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CourseSnapshot>;
  return typeof item.id === 'string' && typeof item.goal === 'string' && (item.mode === 'lite' || item.mode === 'deep') && typeof item.title === 'string' && Boolean(item.plan) && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string';
}

function trimHistory(items: CourseHistoryItem[]) {
  return items
    .filter((item) => item.goal.trim() && item.title.trim())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_COURSE_HISTORY_ITEMS);
}

function writeHistory(items: CourseHistoryItem[]) {
  window.localStorage.setItem(COURSE_HISTORY_STORAGE_KEY, JSON.stringify(trimHistory(items)));
}

function syncSnapshotsToHistory(history: CourseHistoryItem[], snapshots: Record<string, CourseSnapshot>) {
  const allowed = new Set(history.map((item) => item.id));
  return Object.fromEntries(Object.entries(snapshots).filter(([id]) => allowed.has(id)));
}

export function getCourseHistory(): CourseHistoryItem[] {
  if (!canUseLocalStorage()) return [];
  try {
    const rawValue = window.localStorage.getItem(COURSE_HISTORY_STORAGE_KEY);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];
    return trimHistory(parsedValue.filter(isCourseHistoryItem));
  } catch {
    return [];
  }
}

export function getCourseSnapshots(): Record<string, CourseSnapshot> {
  if (!canUseLocalStorage()) return {};
  try {
    const rawValue = window.localStorage.getItem(COURSE_SNAPSHOTS_STORAGE_KEY);
    if (!rawValue) return {};
    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) return {};
    return Object.fromEntries(Object.entries(parsedValue).filter(([, value]) => isSnapshot(value))) as Record<string, CourseSnapshot>;
  } catch {
    return {};
  }
}

export function getCourseSnapshot(courseId: string) {
  if (!courseId.trim()) return null;
  return getCourseSnapshots()[courseId] || null;
}

export function findExistingCourseId(goal: string, mode?: string) {
  const safeGoal = goal.trim();
  const safeMode = normalizeCourseHistoryMode(mode);
  return getCourseHistory().find((item) => item.goal === safeGoal && item.mode === safeMode && !item.legacy)?.id;
}

export function saveCourseSnapshot(item: { id?: string; goal: string; mode?: string; title?: string; plan: MockPlan }) {
  if (!canUseLocalStorage()) return [];
  const goal = item.goal.trim();
  const mode = normalizeCourseHistoryMode(item.mode);
  const title = item.title?.trim() || item.plan.title || goal;
  if (!goal || !title) return getCourseHistory();

  const currentHistory = getCourseHistory();
  const existingItem = currentHistory.find((historyItem) => historyItem.id === item.id || (historyItem.goal === goal && historyItem.mode === mode && !historyItem.legacy));
  const id = item.id || existingItem?.id || generateCourseId(goal, mode);
  const now = new Date().toISOString();
  const snapshot: CourseSnapshot = { id, goal, mode, title, plan: item.plan, createdAt: existingItem?.createdAt || now, updatedAt: now };
  const nextItem: CourseHistoryItem = { id, goal, mode, title, href: buildHistoryHref(id), createdAt: existingItem?.createdAt || now, updatedAt: now };
  const nextHistory = trimHistory([nextItem, ...currentHistory.filter((historyItem) => historyItem.id !== id && !(historyItem.goal === goal && historyItem.mode === mode && !historyItem.legacy))]);

  try {
    const snapshots = syncSnapshotsToHistory(nextHistory, { ...getCourseSnapshots(), [id]: snapshot });
    window.localStorage.setItem(COURSE_SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
    writeHistory(nextHistory);
    return nextHistory;
  } catch {
    return currentHistory;
  }
}

export function saveCourseHistoryItem(item: { goal: string; mode?: string; title?: string; href?: string }) {
  if (!canUseLocalStorage()) return [];
  const goal = item.goal.trim();
  const title = item.title?.trim() || goal;
  if (!goal || !title) return getCourseHistory();
  const mode = normalizeCourseHistoryMode(item.mode);
  const now = new Date().toISOString();
  const id = `legacy:${mode}:${goal.toLowerCase()}`;
  const currentHistory = getCourseHistory();
  const nextItem: CourseHistoryItem = { id, goal, mode, title, href: item.href || buildCourseHistoryHref(goal, mode), createdAt: now, updatedAt: now, legacy: true };
  const nextHistory = trimHistory([nextItem, ...currentHistory.filter((historyItem) => historyItem.id !== id)]);
  try {
    writeHistory(nextHistory);
    return nextHistory;
  } catch {
    return currentHistory;
  }
}

export function touchCourseHistoryItem(courseId: string) {
  if (!canUseLocalStorage()) return [];
  const history = getCourseHistory();
  const item = history.find((historyItem) => historyItem.id === courseId);
  if (!item) return history;
  const nextHistory = trimHistory([{ ...item, updatedAt: new Date().toISOString() }, ...history.filter((historyItem) => historyItem.id !== courseId)]);
  try {
    writeHistory(nextHistory);
    return nextHistory;
  } catch {
    return history;
  }
}

export function removeCourseHistoryItem(id: string) {
  if (!canUseLocalStorage()) return [];
  const nextHistory = getCourseHistory().filter((item) => item.id !== id);
  try {
    const snapshots = getCourseSnapshots();
    delete snapshots[id];
    window.localStorage.setItem(COURSE_SNAPSHOTS_STORAGE_KEY, JSON.stringify(syncSnapshotsToHistory(nextHistory, snapshots)));
    writeHistory(nextHistory);
  } catch {
    return getCourseHistory();
  }
  return nextHistory;
}

export function clearCourseHistory() {
  if (!canUseLocalStorage()) return [];
  try {
    window.localStorage.removeItem(COURSE_HISTORY_STORAGE_KEY);
    window.localStorage.removeItem(COURSE_SNAPSHOTS_STORAGE_KEY);
  } catch {
    return getCourseHistory();
  }
  return [];
}
