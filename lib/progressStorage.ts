export function getProgressStorageKey(goal: string) {
  const normalizedGoal = goal.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-+|-+$/g, '');
  return `ailines-progress-${normalizedGoal || 'default'}`;
}

export function loadProgressState(goal: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(getProgressStorageKey(goal));
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveProgressState(goal: string, completedTaskIds: string[]) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(getProgressStorageKey(goal), JSON.stringify(completedTaskIds));
  } catch {
    // localStorage may be unavailable in private mode or restricted browsers.
  }
}

export function clearProgressState(goal: string) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(getProgressStorageKey(goal));
  } catch {
    // Ignore storage errors so the UI remains usable.
  }
}
