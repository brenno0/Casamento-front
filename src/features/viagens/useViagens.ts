import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { FINANCEIRO_QUERY_KEY } from '../financeiro/useFinanceiro';

export type TipoReserva = 'voo' | 'hospedagem' | 'passeio' | 'outro';
export type Dono = 'noivo' | 'noiva' | 'ambos';

export const LABEL_TIPO_RESERVA: Record<TipoReserva, string> = { voo: 'Voo', hospedagem: 'Hospedagem', passeio: 'Passeio', outro: 'Outro' };
export const LABEL_DONO: Record<Dono, string> = { noivo: 'Noivo', noiva: 'Noiva', ambos: 'Ambos' };

export interface ViagemResumo {
  id: number;
  nome: string;
  destino: string;
  dataInicio: string;
  dataFim: string;
}

export interface Reserva {
  id: number;
  tipo: TipoReserva;
  descricao: string;
  codigo: string;
  data: string;
  voucherArquivoId: number | null;
  valorCentavos: number | null;
  statusPagamento: 'pendente' | 'pago';
  categoriaFinanceiraId: number | null;
  contratoId: number | null;
}

export interface ViagemDetalhe extends ViagemResumo {
  roteiro: { id: number; data: string; horario: string | null; titulo: string; descricao: string; local: string }[];
  reservas: Reserva[];
  mala: { id: number; categoria: string; descricao: string; dono: Dono; naMala: boolean }[];
  progressoMala: Record<Dono, { total: number; naMala: number }>;
}

export const VIAGENS_QUERY_KEY = ['painel', 'viagens'] as const;
export const viagemQueryKey = (id: number) => [...VIAGENS_QUERY_KEY, id] as const;

export const useViagens = () =>
  useQuery({ queryKey: VIAGENS_QUERY_KEY, queryFn: () => api.get<ViagemResumo[]>('/painel/viagens') });
export const useViagem = (id: number) =>
  useQuery({ queryKey: viagemQueryKey(id), queryFn: () => api.get<ViagemDetalhe>(`/painel/viagens/${id}`) });

/** Edição dentro da viagem: grava o detalhe e invalida lista e financeiro (espelho das reservas). */
export function useEditarViagem<V>(id: number, fn: (v: V) => Promise<ViagemDetalhe>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (d) => {
      queryClient.setQueryData(viagemQueryKey(id), d);
      void queryClient.invalidateQueries({ queryKey: VIAGENS_QUERY_KEY, exact: true });
      void queryClient.invalidateQueries({ queryKey: FINANCEIRO_QUERY_KEY });
    },
  });
}

export function useCriarViagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { nome: string; destino?: string; dataInicio: string; dataFim: string }) => api.post<ViagemDetalhe>('/painel/viagens', dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VIAGENS_QUERY_KEY }),
  });
}
