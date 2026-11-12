import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/** Repete no máximo 1 vez, e só falhas de rede ou 5xx (4xx não muda ao repetir). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return !(error instanceof ApiError) || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
