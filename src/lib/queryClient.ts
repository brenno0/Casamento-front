import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { esquecerSessao } from '../features/auth/useSessao';
import { ApiError } from './api';

/** Repete no máximo 1 vez, e só falhas de rede ou 5xx (4xx não muda ao repetir). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return !(error instanceof ApiError) || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  // Sessão expirou no meio do uso: zera a sessão em cache e a guarda leva ao login.
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
      esquecerSessao(client);
    }
  };
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
  return client;
}

export const queryClient = createQueryClient();
