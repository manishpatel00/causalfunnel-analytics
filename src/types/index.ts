export interface EventPayload {
  session_id: string;
  event_type: "page_view" | "click";
  page_url: string;
  timestamp?: string;
  x?: number;
  y?: number;
  viewport_width?: number;
  viewport_height?: number;
  user_agent?: string;
  referrer?: string;
}

export interface SessionSummary {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_seen: string;
  last_seen: string;
  pages_visited: string[];
  duration_seconds: number;
}

export interface EventRecord {
  _id: string;
  session_id: string;
  event_type: "page_view" | "click";
  page_url: string;
  timestamp: string;
  x?: number;
  y?: number;
  viewport_width?: number;
  viewport_height?: number;
  user_agent?: string;
  referrer?: string;
}

export interface ClickPoint {
  x: number;
  y: number;
  timestamp: string;
  viewport_width?: number;
  viewport_height?: number;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
