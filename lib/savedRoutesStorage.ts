export type SavedRoute = {
  id: string;
  goal: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  planUrl: string;
  progressUrl: string;
  askUrl: string;
};

const SAVED_ROUTES_KEY = 'ailines-saved-routes';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function normalizeGoalForId(goal: string) {
  return goal.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-+|-+$/g, '') || 'route';
}

function getRouteUrls(goal: string) {
  const encodedGoal = encodeURIComponent(goal);

  return {
    planUrl: `/plan?goal=${encodedGoal}`,
    progressUrl: `/progress?goal=${encodedGoal}`,
    askUrl: `/ask?goal=${encodedGoal}`,
  };
}

export function readSavedRoutes(): SavedRoute[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SAVED_ROUTES_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((item) => item && typeof item.goal === 'string') : [];
  } catch {
    return [];
  }
}

export function writeSavedRoutes(routes: SavedRoute[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(routes));
  } catch {
    // Keep the UI usable if storage is unavailable or full.
  }
}

export function saveRoute(goal: string): SavedRoute {
  const safeGoal = goal.trim() || '我的目标';
  const now = new Date().toISOString();
  const existingRoutes = readSavedRoutes();
  const existingRoute = existingRoutes.find((route) => route.goal.toLowerCase() === safeGoal.toLowerCase());
  const route: SavedRoute = {
    id: existingRoute?.id || `${normalizeGoalForId(safeGoal)}-${Date.now()}`,
    goal: safeGoal,
    title: `${safeGoal} 学习方案`,
    createdAt: existingRoute?.createdAt || now,
    updatedAt: now,
    ...getRouteUrls(safeGoal),
  };
  const nextRoutes = [route, ...existingRoutes.filter((item) => item.id !== route.id)];
  writeSavedRoutes(nextRoutes);
  return route;
}

export function deleteSavedRoute(routeId: string) {
  const nextRoutes = readSavedRoutes().filter((route) => route.id !== routeId);
  writeSavedRoutes(nextRoutes);
  return nextRoutes;
}
