import React from 'react';
import { useAuth } from './useAuth';
import type { RoleSlug } from './types';

export interface CanProps {
  permission?: string | string[];
  role?: RoleSlug | RoleSlug[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  role,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasRole } = useAuth();

  let permitted = true;

  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission];
    permitted = perms.some((p) => hasPermission(p));
  }

  if (permitted && role) {
    const roles = Array.isArray(role) ? role : [role];
    permitted = hasRole(roles);
  }

  if (!permitted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
