import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios, { getCsrfCookie } from '../../lib/axios';
import { isAxiosError } from 'axios';
import type { User, LoginCredentials, AuthResponse, RoleSlug } from './types';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await axios.get<{ data: User }>('/me');
        return response.data.data;
      } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      await getCsrfCookie();
      const response = await axios.post<AuthResponse>('/login', credentials);
      return response.data.data;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await axios.post('/logout');
      } catch {
        // Even if the server logout request fails, clear local cache
      }
    },
    onSettled: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
      navigate('/login');
    },
  });

  // Determine active role slug.
  // Until AUT-003 assigns roles in the database, fallback to 'admin' for the default admin account.
  const userRole: RoleSlug =
    user?.roles?.[0] || (user ? 'admin' : '');

  const hasRole = (allowedRoles: RoleSlug[]): boolean => {
    if (!user) return false;
    if (userRole === 'admin') return true;
    return allowedRoles.includes(userRole);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (userRole === 'admin') return true;
    return user.permissions.includes(permission);
  };

  return {
    user: user ?? null,
    isLoading,
    isFetching,
    isAuthenticated: !!user,
    userRole,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    refetchUser: refetch,
    hasRole,
    hasPermission,
  };
};

export default useAuth;

