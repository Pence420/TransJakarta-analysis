async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getRoutes: (limit = 50, offset = 0) =>
    fetchJson(`/api/routes?limit=${limit}&offset=${offset}`),
  getRoute: (id: string) =>
    fetchJson(`/api/routes/${id}`),
  getRouteShape: (id: string) =>
    fetchJson(`/api/routes/${id}/shape`),
  getStops: (limit = 100, offset = 0, zoneId?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (zoneId) params.set('zone_id', zoneId);
    return fetchJson(`/api/stops?${params}`);
  },
  getStop: (id: string) =>
    fetchJson(`/api/stops/${id}`),
  getCoverage: () =>
    fetchJson('/api/coverage'),
  getHeadway: (routeId?: string) => {
    const params = routeId ? `?route_id=${routeId}` : '';
    return fetchJson(`/api/headway${params}`);
  },
  getServiceSpan: () =>
    fetchJson('/api/service-span'),
  getFeedVersions: () =>
    fetchJson('/api/feed-versions'),
  getFeedVersionChanges: (id: number, changeType?: string) => {
    const params = changeType ? `?change_type=${changeType}` : '';
    return fetchJson(`/api/feed-versions/${id}/changes${params}`);
  },
};
