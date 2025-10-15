import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query configuration
 * Optimized for real-time applications with Supabase
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Disable refetch on window focus since we have real-time subscriptions
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect to ensure data is up-to-date
      refetchOnReconnect: true,
      
      // Reduce retries to save bandwidth
      retry: 1,
      
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});




