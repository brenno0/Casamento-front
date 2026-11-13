import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { CASAL_PUBLICO_QUERY_KEY, type CasalPublico } from '../site/useCasal';

export const CASAL_PAINEL_QUERY_KEY = ['painel', 'casal'] as const;

export interface CasalUpdate {
  nomeNoiva?: string;
  nomeNoivo?: string;
}

export function useCasalPainel() {
  return useQuery({
    queryKey: CASAL_PAINEL_QUERY_KEY,
    queryFn: () => api.get<CasalPublico>('/painel/casal'),
  });
}

export function useAtualizarCasal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CasalUpdate) => api.put<CasalPublico>('/painel/casal', dados),
    onSuccess: (casal) => {
      queryClient.setQueryData(CASAL_PAINEL_QUERY_KEY, casal);
      queryClient.setQueryData(CASAL_PUBLICO_QUERY_KEY, casal);
    },
  });
}
