'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            
            // Disable refetch on window focus since we have real-time subscriptions
            refetchOnWindowFocus: false,
            
            // Disable refetch on reconnect since we have real-time subscriptions
            refetchOnReconnect: false,
            
            // Disable refetch on mount to prevent excessive re-renders
            refetchOnMount: false,
            
            // Cache data for 10 minutes
            gcTime: 10 * 60 * 1000,
            
            // Reduce retries to save bandwidth
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 1; // Reduced from 3 to 1
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
