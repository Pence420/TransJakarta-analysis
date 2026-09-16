import type {
  Route,
  RouteShape,
  Stop,
  Coverage,
  Headway,
  ServiceSpan,
  FeedVersion,
  PaginatedResponse,
  VersionChanges,
} from '../types';

const BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getRoutes: (limit = 50, offset = 0) =>
    fetchJson<PaginatedResponse<Route>>(`/routes?limit=${limit}&offset=${offset}`),

  getRoute: (id: string) =>
    fetchJson<Route>(`/routes/${encodeURIComponent(id)}`),

  getRouteShape: (id: string) =>
    fetchJson<RouteShape>(`/routes/${encodeURIComponent(id)}/shape`),

  getStops: (limit = 100, offset = 0, zoneId?: string) =>
    fetchJson<PaginatedResponse<Stop>>(
      `/stops?limit=${limit}&offset=${offset}${zoneId ? `&zone_id=${encodeURIComponent(zoneId)}` : ''}`
    ),

  getAllStops: () =>
    fetchJson<PaginatedResponse<Stop>>('/stops?limit=10000&offset=0'),

  getStop: (id: string) =>
    fetchJson<Stop>(`/stops/${encodeURIComponent(id)}`),

  getCoverage: () =>
    fetchJson<Coverage[]>('/coverage'),

  getHeadway: (routeId?: string) =>
    fetchJson<Headway[]>(`/headway${routeId ? `?route_id=${encodeURIComponent(routeId)}` : ''}`),

  getServiceSpan: () =>
    fetchJson<ServiceSpan[]>('/service-span'),

  getFeedVersions: () =>
    fetchJson<FeedVersion[]>('/feed-versions'),

  getFeedVersionChanges: (id: number, changeType?: string) =>
    fetchJson<VersionChanges>(
      `/feed-versions/${id}/changes${changeType ? `?change_type=${changeType}` : ''}`
    ),
};
