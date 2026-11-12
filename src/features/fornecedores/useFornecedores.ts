import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { TAREFAS_QUERY_KEY } from '../tarefas/useTarefas';

export type StatusFornecedor = 'pesquisando' | 'orcado' | 'contratado' | 'descartado';
export type ResponsavelFornecedor = 'casal' | 'familia' | 'cerimonialista';

export const STATUS: { valor: StatusFornecedor; label: string }[] = [
  { valor: 'pesquisando', label: 'Pesquisando' },
  { valor: 'orcado', label: 'Orçado' },
  { valor: 'contratado', label: 'Contratado' },
  { valor: 'descartado', label: 'Descartado' },
];

export const RESPONSAVEIS_FORNECEDOR: { valor: ResponsavelFornecedor; label: string }[] = [
  { valor: 'casal', label: 'Casal' },
  { valor: 'familia', label: 'Família' },
  { valor: 'cerimonialista', label: 'Cerimonialista' },
];

export const CATEGORIAS_SUGERIDAS = [
  'Buffet',
  'Local',
  'Fotografia',
  'Filmagem',
  'Decoração',
  'Música/DJ',
  'Banda',
  'Cerimonialista',
  'Vestido',
  'Traje',
  'Beleza',
  'Doces',
  'Bolo',
  'Convites',
  'Lembranças',
  'Transporte',
  'Outros',
];

/** Próximos status válidos (state-machines.md). */
export const PROXIMOS: Record<StatusFornecedor, StatusFornecedor[]> = {
  pesquisando: ['orcado', 'descartado'],
  orcado: ['contratado', 'descartado'],
  contratado: ['descartado'],
  descartado: [],
};

export const labelStatus = (s: StatusFornecedor) => STATUS.find((x) => x.valor === s)!.label;

export interface ArquivoRef {
  id: number;
  nomeOriginal: string;
  mime: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  categoria: string;
  telefone: string | null;
  email: string | null;
  site: string | null;
  observacoes: string | null;
  status: StatusFornecedor;
  responsavel: ResponsavelFornecedor;
  contrato: ArquivoRef | null;
  menorOrcamentoCentavos: number | null;
  totalOrcamentos: number;
}

export interface Orcamento {
  id: number;
  descricao: string;
  valorCentavos: number;
  data: string;
  arquivo: ArquivoRef | null;
}

export interface FornecedorDetalhe extends Fornecedor {
  orcamentos: Orcamento[];
  tarefas: { id: number; titulo: string }[];
}

export interface DadosFornecedor {
  nome?: string;
  categoria?: string;
  telefone?: string | null;
  email?: string | null;
  site?: string | null;
  observacoes?: string | null;
  responsavel?: ResponsavelFornecedor;
  contratoArquivoId?: number | null;
}

export interface FiltroFornecedores {
  status?: StatusFornecedor;
  categoria?: string;
}

export const FORNECEDORES_QUERY_KEY = ['painel', 'fornecedores'] as const;
export const fornecedorQueryKey = (id: number) => [...FORNECEDORES_QUERY_KEY, 'detalhe', id] as const;

export function useFornecedores(filtro: FiltroFornecedores = {}) {
  const params = new URLSearchParams();
  if (filtro.status) params.set('status', filtro.status);
  if (filtro.categoria) params.set('categoria', filtro.categoria);
  const qs = params.toString();
  return useQuery({
    queryKey: [...FORNECEDORES_QUERY_KEY, 'lista', filtro.status ?? '', filtro.categoria ?? ''],
    queryFn: () => api.get<Fornecedor[]>(`/painel/fornecedores${qs ? `?${qs}` : ''}`),
  });
}

export function useFornecedor(id: number) {
  return useQuery({
    queryKey: fornecedorQueryKey(id),
    queryFn: () => api.get<FornecedorDetalhe>(`/painel/fornecedores/${id}`),
  });
}

/** Mutação que atualiza o detalhe no cache e invalida listas e o quadro de tarefas. */
function useMutacaoFornecedor<V>(fn: (vars: V) => Promise<FornecedorDetalhe>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (detalhe) => {
      queryClient.setQueryData(fornecedorQueryKey(detalhe.id), detalhe);
      void queryClient.invalidateQueries({ queryKey: [...FORNECEDORES_QUERY_KEY, 'lista'] });
      void queryClient.invalidateQueries({ queryKey: TAREFAS_QUERY_KEY });
    },
  });
}

export function useCriarFornecedor() {
  return useMutacaoFornecedor((dados: DadosFornecedor & { nome: string; categoria: string }) =>
    api.post<FornecedorDetalhe>('/painel/fornecedores', dados),
  );
}

export function useAtualizarFornecedor(id: number) {
  return useMutacaoFornecedor((dados: DadosFornecedor) =>
    api.put<FornecedorDetalhe>(`/painel/fornecedores/${id}`, dados),
  );
}

export function useMudarStatus(id: number) {
  return useMutacaoFornecedor((status: StatusFornecedor) =>
    api.post<FornecedorDetalhe>(`/painel/fornecedores/${id}/status`, { status }),
  );
}

export function useCriarOrcamento(id: number) {
  return useMutacaoFornecedor((dados: { descricao: string; valorCentavos: number; data: string; arquivoId?: number | null }) =>
    api.post<FornecedorDetalhe>(`/painel/fornecedores/${id}/orcamentos`, dados),
  );
}

export function useExcluirOrcamento(id: number) {
  return useMutacaoFornecedor((orcamentoId: number) =>
    api.del<FornecedorDetalhe>(`/painel/fornecedores/${id}/orcamentos/${orcamentoId}`),
  );
}

export function useExcluirFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/painel/fornecedores/${id}`),
    onSuccess: (_v, id) => {
      queryClient.removeQueries({ queryKey: fornecedorQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: [...FORNECEDORES_QUERY_KEY, 'lista'] });
      void queryClient.invalidateQueries({ queryKey: TAREFAS_QUERY_KEY });
    },
  });
}
