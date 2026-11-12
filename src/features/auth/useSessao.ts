import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, ApiError } from '../../lib/api';

export interface Conta {
  id: number;
  nome: string;
  email: string;
}

export const SESSAO_QUERY_KEY = ['auth', 'me'] as const;

/** Conta da sessão atual; `null` quando não há sessão (401). */
export function useSessao() {
  return useQuery({
    queryKey: SESSAO_QUERY_KEY,
    queryFn: async (): Promise<Conta | null> => {
      try {
        const { conta } = await api.get<{ conta: Conta }>('/auth/me');
        return conta;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export interface LoginInput {
  email: string;
  senha: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<{ conta: Conta }>('/auth/login', input),
    onSuccess: ({ conta }) => {
      queryClient.setQueryData(SESSAO_QUERY_KEY, conta);
    },
  });
}

/** Encerra a sessão (mesmo se a API falhar, o front esquece a conta) e volta ao login. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      // Esquece a sessão antes de navegar, para o login não ver conta em cache e voltar ao painel.
      esquecerSessao(queryClient);
      void navigate('/login', { replace: true });
    },
  });
}

/** Zera a sessão em cache e remove os dados do painel (que não podem sobreviver à saída). */
export function esquecerSessao(queryClient: QueryClient): void {
  queryClient.setQueryData(SESSAO_QUERY_KEY, null);
  queryClient.removeQueries({ queryKey: ['painel'] });
}

/**
 * Destino pós-login vindo de `?next=`: só caminhos do painel, para não virar redirecionamento
 * aberto. Tab/CR/LF saem antes, pois o navegador os ignora em URLs (`/\t/x` vira `//x`).
 */
export function destinoSeguro(next: string | null): string {
  const limpo = (next ?? '').replace(/[\t\r\n]/g, '');
  return /^\/painel(?:[/?#]|$)/.test(limpo) ? limpo : '/painel';
}
