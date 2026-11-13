import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export type Tipo = 'adulto' | 'crianca';
export type Lado = 'noivo' | 'noiva' | 'ambos';
export type Funcao = 'padrinho' | 'madrinha' | 'dama' | 'pajem';
export type Rsvp = 'sem_resposta' | 'vai' | 'nao_vai';
export type StatusEnvio = 'nao_enviado' | 'enviado';

export const LABEL_TIPO: Record<Tipo, string> = { adulto: 'Adulto', crianca: 'Criança' };
export const LABEL_LADO: Record<Lado, string> = { noivo: 'Noivo', noiva: 'Noiva', ambos: 'Ambos' };
export const LABEL_FUNCAO: Record<Funcao, string> = {
  padrinho: 'Padrinho',
  madrinha: 'Madrinha',
  dama: 'Dama',
  pajem: 'Pajem',
};
export const LABEL_RSVP: Record<Rsvp, string> = { sem_resposta: 'Sem resposta', vai: 'Vai', nao_vai: 'Não vai' };

export interface Convidado {
  id: number;
  grupoId: number;
  nome: string;
  tipo: Tipo;
  lado: Lado;
  funcao: Funcao | null;
  telefone: string | null;
  email: string | null;
  acompanhantePermitido: boolean;
  acompanhanteNome: string | null;
  rsvp: Rsvp;
  rsvpEm: string | null;
}

export interface Grupo {
  id: number;
  nome: string;
  token: string;
  mensagem: string | null;
  statusEnvio: StatusEnvio;
  enviadoEm: string | null;
  contatoConvidadoId: number | null;
  convidados: Convidado[];
}

export interface Resumo {
  pessoas: number;
  convidados: number;
  acompanhantes: number;
  adultos: number;
  criancas: number;
  porLado: Record<Lado, number>;
  porRsvp: Record<Rsvp, number>;
  porFuncao: Record<Funcao, number>;
  grupos: number;
}

export type DadosConvidado = Partial<Omit<Convidado, 'id' | 'rsvp' | 'rsvpEm'>> & { nome?: string };

export const CONVIDADOS_QUERY_KEY = ['painel', 'convidados'] as const;
export const GRUPOS_QUERY_KEY = [...CONVIDADOS_QUERY_KEY, 'grupos'] as const;
export const RESUMO_QUERY_KEY = [...CONVIDADOS_QUERY_KEY, 'resumo'] as const;

export function useGrupos(busca: string, naoConfirmados = false) {
  const termo = busca.trim();
  const params = new URLSearchParams();
  if (termo) params.set('busca', termo);
  if (naoConfirmados) params.set('naoConfirmados', 'true');
  const qs = params.toString();
  return useQuery({
    queryKey: [...GRUPOS_QUERY_KEY, termo, naoConfirmados],
    queryFn: () => api.get<Grupo[]>(`/painel/grupos${qs ? `?${qs}` : ''}`),
  });
}

export const useResumo = () =>
  useQuery({ queryKey: RESUMO_QUERY_KEY, queryFn: () => api.get<Resumo>('/painel/convidados/resumo') });

function useMutacao<V, R>(fn: (vars: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVIDADOS_QUERY_KEY }),
  });
}

export const useCriarGrupo = () =>
  useMutacao((dados: { nome: string; mensagem?: string | null }) => api.post<Grupo>('/painel/grupos', dados));
export const useMarcarEnviado = () => useMutacao((id: number) => api.post<Grupo>(`/painel/grupos/${id}/envio`));
export const useAtualizarGrupo = () =>
  useMutacao(({ id, ...dados }: { id: number; nome?: string; mensagem?: string | null; contatoConvidadoId?: number | null }) =>
    api.put<Grupo>(`/painel/grupos/${id}`, dados),
  );
export const useExcluirGrupo = () => useMutacao((id: number) => api.del<void>(`/painel/grupos/${id}`));

export const useCriarConvidado = () =>
  useMutacao((dados: DadosConvidado & { nome: string }) => api.post<Convidado>('/painel/convidados', dados));
export const useAtualizarConvidado = () =>
  useMutacao(({ id, ...dados }: DadosConvidado & { id: number }) =>
    api.put<Convidado>(`/painel/convidados/${id}`, dados),
  );
export const useExcluirConvidado = () => useMutacao((id: number) => api.del<void>(`/painel/convidados/${id}`));

export interface Filtros {
  lado: Lado | '';
  tipo: Tipo | '';
  funcao: Funcao | '';
  rsvp: Rsvp | '';
}

export function passaFiltros(c: Convidado, f: Filtros): boolean {
  return (
    (!f.lado || c.lado === f.lado) &&
    (!f.tipo || c.tipo === f.tipo) &&
    (!f.funcao || c.funcao === f.funcao) &&
    (!f.rsvp || c.rsvp === f.rsvp)
  );
}
