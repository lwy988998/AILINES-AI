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

export type SaveRouteResult = {
  route: SavedRoute;
  status: 'created' | 'updated';
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

export function getRouteStorageKey() {
  return SAVED_ROUTES_KEY;
}

export function getSavedRoutes(): SavedRoute[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(getRouteStorageKey());
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((item) => item && typeof item.goal === 'string') : [];
  } catch {
    return [];
  }
}

function writeSavedRoutes(routes: SavedRoute[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(getRouteStorageKey(), JSON.stringify(routes));
  } catch {
    // Keep the UI usable if storage is unavailable or full.
  }
}

export function saveRoute(goal: string): SaveRouteResult {
  const safeGoal = goal.trim() || '我的目标';
  const now = new Date().toISOString();
  const existingRoutes = getSavedRoutes();
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

  return {
    route,
    status: existingRoute ? 'updated' : 'created',
  };
}

export function removeSavedRoute(routeId: string) {
  const nextRoutes = getSavedRoutes().filter((route) => route.id !== routeId);
  writeSavedRoutes(nextRoutes);
  return nextRoutes;
}
