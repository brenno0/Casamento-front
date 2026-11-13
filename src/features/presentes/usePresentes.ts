import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiFetch } from '../../lib/api';

export interface ItemVitrine {
  id: number;
  nome: string;
  descricao: string;
  fotoUrl: string | null;
  precoCentavos: number;
  fracionavel: boolean;
  cotaMinimaCentavos: number;
  restante: number;
  progresso: number;
  esgotado: boolean;
  linkLoja: string | null;
  viagem: { nome: string } | null;
}

/** Camada da vitrine: `null` = pública; string = token do convite. */
export type Camada = string | null;

export const vitrineQueryKey = (token: Camada) => (token ? (['convite', token, 'presentes'] as const) : (['publico', 'presentes'] as const));

export function useVitrine(token: Camada) {
  return useQuery({
    queryKey: vitrineQueryKey(token),
    queryFn: () => api.get<ItemVitrine[]>(token ? `/convite/${encodeURIComponent(token)}/presentes` : '/publico/presentes'),
  });
}

export interface DadosJaComprei {
  doadorNome?: string;
  mensagem?: string;
  numeroPedido?: string | null;
  fotoArquivoId?: number | null;
}

export function useJaComprei(token: Camada) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, ...dados }: DadosJaComprei & { itemId: number }) =>
      api.post<{ id: number }>(
        token ? `/convite/${encodeURIComponent(token)}/presentes/${itemId}/ja-comprei` : `/publico/presentes/${itemId}/ja-comprei`,
        dados,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vitrineQueryKey(token) }),
  });
}

/** Foto opcional do convidado (comprovante/pedido). */
export function enviarFotoConvidado(file: File): Promise<{ id: number }> {
  const form = new FormData();
  form.append('arquivo', file);
  return apiFetch<{ id: number }>('/publico/uploads', { method: 'POST', body: form });
}
