import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface CasalPublico {
  nomeNoiva: string;
  nomeNoivo: string;
  dataCasamento: string;
}

export const CASAL_PUBLICO_QUERY_KEY = ['publico', 'casal'] as const;

export function useCasalPublico() {
  return useQuery({
    queryKey: CASAL_PUBLICO_QUERY_KEY,
    queryFn: () => api.get<CasalPublico>('/publico/casal'),
  });
}
