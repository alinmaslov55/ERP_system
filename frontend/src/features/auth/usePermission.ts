import { useAuth } from './useAuth';

export const usePermission = (permission: string | string[]): boolean => {
  const { hasPermission } = useAuth();
  const perms = Array.isArray(permission) ? permission : [permission];
  return perms.some((p) => hasPermission(p));
};

export default usePermission;
