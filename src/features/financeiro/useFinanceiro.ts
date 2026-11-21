import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface Categoria {
  id: number;
  nome: string;
  previstoCentavos: number;
}

export interface Parcela {
  id: number;
  contratoId: number;
  vencimento: string;
  valorCentavos: number;
  status: 'pendente' | 'pago';
  pagoEm: string | null;
  comprovanteArquivoId: number | null;
  atrasada: boolean;
}

export interface ParcelaResumo extends Parcela {
  contratoDescricao: string;
  categoriaNome: string;
}

export interface Contrato {
  id: number;
  categoriaId: number;
  categoriaNome: string;
  fornecedorId: number | null;
  fornecedorNome: string | null;
  descricao: string;
  valorContratadoCentavos: number;
  pagoCentavos: number;
  parceladoCentavos: number;
  parcelas: Parcela[];
  /** Espelho de reserva de viagem: edita pela viagem. */
  viagemId: number | null;
}

export interface Reserva {
  id: number;
  titular: string;
  valorCentavos: number;
  atualizadoEm: string | null;
}

export interface Dashboard {
  hoje: string;
  categorias: (Categoria & { contratadoCentavos: number; pagoCentavos: number })[];
  totais: {
    previstoCentavos: number;
    contratadoCentavos: number;
    pagoCentavos: number;
    faltaPagarCentavos: number;
    reservadoCentavos: number;
  };
  reservas: Reserva[];
  porFornecedor: { fornecedorId: number; nome: string; contratadoCentavos: number; pagoCentavos: number }[];
  fornecedoresSemContrato: { id: number; nome: string }[];
  proximosVencimentos: ParcelaResumo[];
  atrasadas: ParcelaResumo[];
}

/** Prefixo de tudo do financeiro: toda mutação invalida o conjunto (dashboard depende de tudo). */
export const FINANCEIRO_QUERY_KEY = ['painel', 'financeiro'] as const;
export const DASHBOARD_QUERY_KEY = [...FINANCEIRO_QUERY_KEY, 'dashboard'] as const;
export const CATEGORIAS_QUERY_KEY = [...FINANCEIRO_QUERY_KEY, 'categorias'] as const;
export const CONTRATOS_QUERY_KEY = [...FINANCEIRO_QUERY_KEY, 'contratos'] as const;

export const useDashboard = () =>
  useQuery({ queryKey: DASHBOARD_QUERY_KEY, queryFn: () => api.get<Dashboard>('/painel/financeiro/dashboard') });
export const useCategorias = () =>
  useQuery({ queryKey: CATEGORIAS_QUERY_KEY, queryFn: () => api.get<Categoria[]>('/painel/financeiro/categorias') });
export const useContratos = () =>
  useQuery({ queryKey: CONTRATOS_QUERY_KEY, queryFn: () => api.get<Contrato[]>('/painel/financeiro/contratos') });

function useMutacao<V, R>(fn: (vars: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FINANCEIRO_QUERY_KEY }),
  });
}

export const useCriarCategoria = () =>
  useMutacao((dados: { nome: string; previstoCentavos?: number }) =>
    api.post<Categoria>('/painel/financeiro/categorias', dados),
  );
export const useAtualizarCategoria = () =>
  useMutacao(({ id, ...dados }: { id: number; nome?: string; previstoCentavos?: number }) =>
    api.put<Categoria>(`/painel/financeiro/categorias/${id}`, dados),
  );
export const useExcluirCategoria = () =>
  useMutacao((id: number) => api.del<void>(`/painel/financeiro/categorias/${id}`));

/** Contratado, pago e o que falta de uma lista de contratos. */
export function totaisDe(contratos: Contrato[]) {
  const contratado = contratos.reduce((n, c) => n + c.valorContratadoCentavos, 0);
  const pago = contratos.reduce((n, c) => n + c.pagoCentavos, 0);
  return { contratado, pago, falta: contratado - pago };
}

export interface NovoContrato {
  categoriaId: number;
  descricao: string;
  valorContratadoCentavos: number;
  fornecedorId?: number | null;
  /** Já pago: vira uma parcela paga. */
  entrada?: { valorCentavos: number; pagoEm: string };
  /** O que falta, dividido em parcelas mensais. */
  restante?: { quantidade: number; primeiroVencimento: string };
}

export const useCriarContrato = () =>
  useMutacao(
    (dados: NovoContrato) =>
      api.post<Contrato>('/painel/financeiro/contratos', dados),
  );
export const useCriarReserva = () =>
  useMutacao((dados: { titular: string; valorCentavos?: number }) => api.post<Reserva[]>('/painel/financeiro/reservas', dados));
export const useAtualizarReserva = () =>
  useMutacao(({ id, ...dados }: { id: number; titular?: string; valorCentavos?: number }) =>
    api.put<Reserva[]>(`/painel/financeiro/reservas/${id}`, dados),
  );
export const useExcluirReserva = () => useMutacao((id: number) => api.del<Reserva[]>(`/painel/financeiro/reservas/${id}`));

export const useAtualizarContrato = () =>
  useMutacao(
    ({ id, ...dados }: { id: number; categoriaId?: number; descricao?: string; valorContratadoCentavos?: number; fornecedorId?: number | null }) =>
      api.put<Contrato>(`/painel/financeiro/contratos/${id}`, dados),
  );
export const useEditarParcela = () =>
  useMutacao(({ id, ...dados }: { id: number; vencimento?: string; valorCentavos?: number }) =>
    api.put<Contrato>(`/painel/financeiro/parcelas/${id}`, dados),
  );

export const useExcluirContrato = () =>
  useMutacao((id: number) => api.del<void>(`/painel/financeiro/contratos/${id}`));

export const useGerarParcelas = () =>
  useMutacao(
    ({ contratoId, ...dados }: { contratoId: number; quantidade: number; primeiroVencimento: string; valorTotalCentavos: number }) =>
      api.post<Contrato>(`/painel/financeiro/contratos/${contratoId}/parcelas/gerar`, dados),
  );
export const usePagarParcela = () =>
  useMutacao(({ id, ...dados }: { id: number; pagoEm: string; comprovanteArquivoId?: number | null }) =>
    api.post<Contrato>(`/painel/financeiro/parcelas/${id}/pagar`, dados),
  );
export const useDesfazerPagamento = () =>
  useMutacao((id: number) => api.post<Contrato>(`/painel/financeiro/parcelas/${id}/desfazer-pagamento`));
export const useExcluirParcela = () =>
  useMutacao((id: number) => api.del<Contrato>(`/painel/financeiro/parcelas/${id}`));
