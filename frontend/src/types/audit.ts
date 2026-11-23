export interface ActorSummary {
  id: number;
  name: string;
}

export interface AuditLog {
  id: number;
  action: string;
  auditable_type: string;
  auditable_type_label: string;
  auditable_id: number;
  target_label: string;
  actor: ActorSummary | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface AuditLogFilters {
  actor_id?: number;
  action?: string;
  auditable_type?: string;
  auditable_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}
