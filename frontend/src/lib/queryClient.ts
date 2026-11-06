import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Never retry 401 Unauthorized or 403 Forbidden
        if (isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
  },
});

