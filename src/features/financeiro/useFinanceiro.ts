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
}

export interface Dashboard {
  hoje: string;
  categorias: (Categoria & { contratadoCentavos: number; pagoCentavos: number })[];
  totais: { previstoCentavos: number; contratadoCentavos: number; pagoCentavos: number };
  proximosVencimentos: ParcelaResumo[];
  atrasadas: ParcelaResumo[];
  presentesRecebidosCentavos: number;
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

export const useCriarContrato = () =>
  useMutacao(
    (dados: { categoriaId: number; descricao: string; valorContratadoCentavos: number; fornecedorId?: number | null }) =>
      api.post<Contrato>('/painel/financeiro/contratos', dados),
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
