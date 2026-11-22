export type RoleSlug = 'admin' | 'manager' | 'warehouse_operator' | 'sales_operator' | string;

export interface RoleDetail {
  id: number;
  name: string;
  slug: RoleSlug;
  description?: string;
}

export interface ActorSummary {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  roles: RoleSlug[];
  role_ids?: number[];
  role_details?: RoleDetail[];
  permissions: string[];
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  slug: RoleSlug;
  description?: string;
  permissions: string[];
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  message: string;
  data: User;
}
