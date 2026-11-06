export type RoleSlug = 'admin' | 'manager' | 'warehouse_operator' | 'sales_operator' | string;

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  roles: RoleSlug[];
  permissions: string[];
  created_at: string;
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

