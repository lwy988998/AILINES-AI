export type CourseHistoryMode = 'lite' | 'deep';

export type CourseHistoryItem = {
  id: string;
  goal: string;
  mode: CourseHistoryMode;
  title: string;
  href: string;
  createdAt: string;
  updatedAt: string;
};

export const COURSE_HISTORY_STORAGE_KEY = 'ailines-course-history';
export const MAX_COURSE_HISTORY_ITEMS = 5;

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function normalizeCourseHistoryMode(mode?: string): CourseHistoryMode {
  return mode === 'lite' || mode === 'deep' ? mode : 'deep';
}

export function buildCourseHistoryHref(goal: string, mode?: string) {
  const normalizedGoal = goal.trim();
  const params = new URLSearchParams({
    goal: normalizedGoal,
    mode: normalizeCourseHistoryMode(mode),
  });

  return `/plan?${params.toString()}`;
}

function createCourseHistoryId(goal: string, mode: CourseHistoryMode) {
  return `${mode}:${goal.trim().toLowerCase()}`;
}

function isCourseHistoryItem(value: unknown): value is CourseHistoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<CourseHistoryItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.goal === 'string' &&
    (item.mode === 'lite' || item.mode === 'deep') &&
    typeof item.title === 'string' &&
    typeof item.href === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string'
  );
}

function trimHistory(items: CourseHistoryItem[]) {
  return items
    .filter((item) => item.goal.trim() && item.title.trim())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_COURSE_HISTORY_ITEMS);
}

export function getCourseHistory(): CourseHistoryItem[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(COURSE_HISTORY_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return trimHistory(parsedValue.filter(isCourseHistoryItem));
  } catch {
    return [];
  }
}

export function saveCourseHistoryItem(item: {
  goal: string;
  mode?: string;
  title?: string;
  href?: string;
}) {
  if (!canUseLocalStorage()) {
    return [];
  }

  const goal = item.goal.trim();
  const title = item.title?.trim() || goal;

  if (!goal || !title) {
    return getCourseHistory();
  }

  const mode = normalizeCourseHistoryMode(item.mode);
  const href = item.href || buildCourseHistoryHref(goal, mode);
  const now = new Date().toISOString();
  const id = createCourseHistoryId(goal, mode);
  const currentHistory = getCourseHistory();
  const existingItem = currentHistory.find((historyItem) => historyItem.id === id || (historyItem.goal === goal && historyItem.mode === mode));
  const nextItem: CourseHistoryItem = {
    id,
    goal,
    mode,
    title,
    href,
    createdAt: existingItem?.createdAt || now,
    updatedAt: now,
  };
  const nextHistory = trimHistory([
    nextItem,
    ...currentHistory.filter((historyItem) => historyItem.id !== id && !(historyItem.goal === goal && historyItem.mode === mode)),
  ]);

  try {
    window.localStorage.setItem(COURSE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    return currentHistory;
  }

  return nextHistory;
}

export function removeCourseHistoryItem(id: string) {
  if (!canUseLocalStorage()) {
    return [];
  }

  const nextHistory = getCourseHistory().filter((item) => item.id !== id);

  try {
    window.localStorage.setItem(COURSE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    return getCourseHistory();
  }

  return nextHistory;
}

export function clearCourseHistory() {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    window.localStorage.removeItem(COURSE_HISTORY_STORAGE_KEY);
  } catch {
    return getCourseHistory();
  }

  return [];
}
