import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface CasalPublico {
  nomeNoiva: string;
  nomeNoivo: string;
  dataCasamento: string;
}

export function useCasalPublico() {
  return useQuery({
    queryKey: ['publico', 'casal'],
    queryFn: () => api.get<CasalPublico>('/publico/casal'),
  });
}
