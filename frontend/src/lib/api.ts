import type {
  Route, Stop, RouteShape, Coverage, Headway,
  ServiceSpan, FeedVersion, PaginatedResponse, ChangesResponse,
} from './types';

const BASE = '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getRoutes: (limit = 500, offset = 0) =>
    fetchJSON<PaginatedResponse<Route>>(`${BASE}/routes?limit=${limit}&offset=${offset}`),

  getRoute: (id: string) =>
    fetchJSON<Route>(`${BASE}/routes/${id}`),

  getRouteShape: (id: string) =>
    fetchJSON<RouteShape>(`${BASE}/routes/${id}/shape`),

  getStops: (limit = 100, offset = 0, zoneId?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (zoneId) params.set('zone_id', zoneId);
    return fetchJSON<PaginatedResponse<Stop>>(`${BASE}/stops?${params}`);
  },

  getCoverage: () =>
    fetchJSON<Coverage[]>(`${BASE}/coverage`),

  getHeadway: (routeId?: string) => {
    const params = routeId ? `?route_id=${routeId}` : '';
    return fetchJSON<Headway[]>(`${BASE}/headway${params}`);
  },

  getServiceSpan: () =>
    fetchJSON<ServiceSpan[]>(`${BASE}/service-span`),

  getFeedVersions: () =>
    fetchJSON<FeedVersion[]>(`${BASE}/feed-versions`),

  getFeedVersionChanges: (versionId: number, changeType?: string) => {
    const params = changeType ? `?change_type=${changeType}` : '';
    return fetchJSON<ChangesResponse>(`${BASE}/feed-versions/${versionId}/changes${params}`);
  },
};
