import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from '../../lib/api';

export type Responsavel = 'noivo' | 'noiva' | 'ambos' | 'cerimonialista';
export type FiltroTarefas = 'todas' | 'atrasadas' | 'semana';

export const RESPONSAVEIS: { valor: Responsavel; label: string }[] = [
  { valor: 'ambos', label: 'Ambos' },
  { valor: 'noiva', label: 'Noiva' },
  { valor: 'noivo', label: 'Noivo' },
  { valor: 'cerimonialista', label: 'Cerimonialista' },
];

export interface Tarefa {
  id: number;
  colunaId: number;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  responsavel: Responsavel;
  ordem: number;
}

export interface Coluna {
  id: number;
  nome: string;
  ordem: number;
  concluida: boolean;
}

export interface ColunaComTarefas extends Coluna {
  tarefas: Tarefa[];
}

export interface Quadro {
  /** Dia civil (São Paulo) segundo o servidor. */
  hoje: string;
  colunas: ColunaComTarefas[];
}

/** Prefixo de todas as queries de tarefas (invalidado por toda mutação). */
export const TAREFAS_QUERY_KEY = ['painel', 'tarefas'] as const;

export function quadroQueryKey(filtro: FiltroTarefas) {
  return [...TAREFAS_QUERY_KEY, filtro] as const;
}

export function useQuadro(filtro: FiltroTarefas) {
  return useQuery({
    queryKey: quadroQueryKey(filtro),
    queryFn: () =>
      api.get<Quadro>(filtro === 'todas' ? '/painel/tarefas' : `/painel/tarefas?filtro=${filtro}`),
    // Ao trocar de filtro, o quadro anterior fica na tela até o novo chegar.
    placeholderData: keepPreviousData,
  });
}

/** Atrasada: prazo antes de hoje e fora de coluna concluída. */
export function estaAtrasada(tarefa: Pick<Tarefa, 'prazo'>, coluna: Coluna, hoje: string): boolean {
  return !coluna.concluida && tarefa.prazo !== null && tarefa.prazo < hoje;
}

/**
 * Aplica um movimento ao quadro (mesma regra do servidor): tira a tarefa da coluna de origem,
 * insere na posição `ordem` do destino (além do fim → fim) e renumera as colunas.
 */
export function moverNoQuadro(
  quadro: Quadro,
  { id, colunaId, ordem }: { id: number; colunaId: number; ordem: number },
): Quadro {
  const tarefa = quadro.colunas.flatMap((c) => c.tarefas).find((t) => t.id === id);
  if (!tarefa || !quadro.colunas.some((c) => c.id === colunaId)) return quadro;
  const movida = { ...tarefa, colunaId };

  return {
    ...quadro,
    colunas: quadro.colunas.map((c) => {
      if (c.id !== colunaId && c.id !== tarefa.colunaId) return c;
      const tarefas = c.tarefas.filter((t) => t.id !== id);
      if (c.id === colunaId) tarefas.splice(Math.min(ordem, tarefas.length), 0, movida);
      return { ...c, tarefas: tarefas.map((t, i) => (t.ordem === i ? t : { ...t, ordem: i })) };
    }),
  };
}

function useInvalidarTarefas() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: TAREFAS_QUERY_KEY });
}

export interface TarefaInput {
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  responsavel: Responsavel;
}

export function useCriarTarefa() {
  const invalidar = useInvalidarTarefas();
  return useMutation({
    mutationFn: (dados: TarefaInput & { colunaId: number }) => api.post<Tarefa>('/painel/tarefas', dados),
    onSuccess: invalidar,
  });
}

export function useAtualizarTarefa() {
  const invalidar = useInvalidarTarefas();
  return useMutation({
    mutationFn: ({ id, ...dados }: Partial<TarefaInput> & { id: number }) =>
      api.put<Tarefa>(`/painel/tarefas/${id}`, dados),
    onSuccess: invalidar,
  });
}

export function useExcluirTarefa() {
  const invalidar = useInvalidarTarefas();
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/painel/tarefas/${id}`),
    onSuccess: invalidar,
  });
}

export interface MoverVars {
  id: number;
  colunaId: number;
  ordem: number;
}

/**
 * Mover com atualização otimista no quadro "todas". O cache é atualizado já na chamada
 * (sem esperar um tick), para o cartão não "voltar" entre o soltar e a resposta.
 */
export const MOVER_MUTATION_KEY = ['tarefas', 'mover'] as const;

export function useMoverTarefa() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: MOVER_MUTATION_KEY,
    mutationFn: ({ id, colunaId, ordem }: MoverVars & { anterior?: Quadro }) =>
      api.post<Tarefa>(`/painel/tarefas/${id}/mover`, { colunaId, ordem }),
    onError: (_error, { anterior }) => {
      // Com outro movimento em voo, o instantâneo apagaria esse movimento; o refetch do onSettled corrige.
      const outrosEmVoo = queryClient.isMutating({ mutationKey: MOVER_MUTATION_KEY }) > 1;
      if (anterior && !outrosEmVoo) queryClient.setQueryData(quadroQueryKey('todas'), anterior);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TAREFAS_QUERY_KEY }),
  });

  function mover(vars: MoverVars) {
    void aplicarOtimista(queryClient, vars).then((anterior) => mutation.mutate({ ...vars, anterior }));
  }

  return { ...mutation, mover };
}

async function aplicarOtimista(queryClient: QueryClient, vars: MoverVars): Promise<Quadro | undefined> {
  const key = quadroQueryKey('todas');
  // Um refetch em andamento sobrescreveria o estado otimista ao terminar.
  await queryClient.cancelQueries({ queryKey: key });
  const anterior = queryClient.getQueryData<Quadro>(key);
  if (anterior) queryClient.setQueryData(key, moverNoQuadro(anterior, vars));
  return anterior;
}

export function useCriarColuna() {
  const invalidar = useInvalidarTarefas();
  return useMutation({
    mutationFn: (nome: string) => api.post<Coluna>('/painel/tarefas/colunas', { nome }),
    onSuccess: invalidar,
  });
}

export function useRenomearColuna() {
  const invalidar = useInvalidarTarefas();
  return useMutation({
    mutationFn: ({ id, ...dados }: { id: number; nome?: string; concluida?: boolean }) =>
      api.put<Coluna>(`/painel/tarefas/colunas/${id}`, dados),
    onSuccess: invalidar,
  });
}

export function useExcluirColuna() {
  const invalidar = useInvalidarTarefas();
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/painel/tarefas/colunas/${id}`),
    onSuccess: invalidar,
  });
}
