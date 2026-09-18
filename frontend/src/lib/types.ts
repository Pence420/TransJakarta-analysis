export interface Route {
  route_id: string;
  agency_id: string | null;
  route_short_name: string | null;
  route_long_name: string | null;
  route_desc: string | null;
  route_type: number | null;
  route_url: string | null;
  route_color: string | null;
  route_text_color: string | null;
}

export interface Stop {
  stop_id: string;
  stop_code: string | null;
  stop_name: string | null;
  stop_desc: string | null;
  stop_lat: number | null;
  stop_lon: number | null;
  zone_id: string | null;
  location_type: number | null;
  parent_station: string | null;
}

export interface RouteShape {
  route_id: string;
  shape_id: string | null;
  coordinates: [number, number][];
}

export interface Coverage {
  zone_id: string;
  total_stops: number;
  unique_stations: number;
}

export interface Headway {
  route_id: string;
  route_short_name: string | null;
  route_long_name: string | null;
  service_hour: number;
  avg_headway_minutes: number;
  min_headway_minutes: number;
  max_headway_minutes: number;
  trip_pairs_count: number;
}

export interface ServiceSpan {
  route_id: string;
  route_short_name: string | null;
  route_long_name: string | null;
  first_departure: string | null;
  last_departure: string | null;
  service_hours: number | null;
  unique_departure_times: number;
}

export interface FeedVersion {
  feed_version_id: number;
  fetch_timestamp: string;
  file_hash: string;
  file_size_bytes: number | null;
}

export type EntityType = 'route' | 'stop' | 'schedule';
export type ChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED';

export interface Change {
  change_id: number;
  feed_version_id: number;
  prev_version_id: number | null;
  route_id?: string;
  stop_id?: string;
  trip_id?: string;
  change_type: ChangeType;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  entity_type?: EntityType;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChangesResponse {
  route_changes: Change[];
  stop_changes: Change[];
  schedule_changes: Change[];
}

export interface KpiItem {
  label: string;
  value: string;
  sub?: string;
  icon: 'route' | 'stop' | 'station' | 'zone' | 'clock' | 'calendar' | 'activity' | 'gauge';
}