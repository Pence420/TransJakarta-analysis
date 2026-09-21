import type {
  ChangesResponse,
  Coverage,
  FeedVersion,
  Headway,
  PaginatedResponse,
  Route,
  RouteMapData,
  RouteShape,
  ServiceSpan,
  Stop,
} from './types';

const BASE = '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function params(query: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined) search.set(key, String(value));
  });
  return search.toString();
}

export const api = {
  getRoutes: (limit = 500, offset = 0) =>
    fetchJSON<PaginatedResponse<Route>>(`${BASE}/routes?${params({ limit, offset })}`),

  getRoute: (id: string) => fetchJSON<Route>(`${BASE}/routes/${id}`),

  getRouteShape: (id: string) => fetchJSON<RouteShape>(`${BASE}/routes/${id}/shape`),

  getRouteMapData: (id: string) => fetchJSON<RouteMapData>(`${BASE}/routes/${id}/map-data`),

  getStops: (limit = 100, offset = 0, zoneId?: string) => {
    const q = params({ limit, offset, zone_id: zoneId });
    return fetchJSON<PaginatedResponse<Stop>>(`${BASE}/stops?${q}`);
  },

  getCoverage: () => fetchJSON<Coverage[]>(`${BASE}/coverage`),

  getHeadway: (routeId?: string) => {
    const q = routeId ? `?${params({ route_id: routeId })}` : '';
    return fetchJSON<Headway[]>(`${BASE}/headway${q}`);
  },

  getServiceSpan: () => fetchJSON<ServiceSpan[]>(`${BASE}/service-span`),

  getFeedVersions: () => fetchJSON<FeedVersion[]>(`${BASE}/feed-versions`),

  getFeedVersionChanges: (versionId: number, changeType?: string) => {
    const q = changeType ? `?${params({ change_type: changeType })}` : '';
    return fetchJSON<ChangesResponse>(`${BASE}/feed-versions/${versionId}/changes${q}`);
  },
};
