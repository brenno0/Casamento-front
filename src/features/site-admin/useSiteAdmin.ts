import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SITE_PUBLICO_QUERY_KEY, type LocalConvite, type TipoLocal } from '../site/useSite';

export interface SitePainel {
  locais: (LocalConvite & { id: number })[];
  config: { dressCode: string; paleta: string[] };
  historia: { id: number; data: string; titulo: string; texto: string; fotoArquivoId: number | null; fotoUrl: string | null }[];
  galeria: { id: number; arquivoId: number; fotoUrl: string; legenda: string }[];
  faq: { id: number; pergunta: string; resposta: string }[];
}

export const SITE_PAINEL_QUERY_KEY = ['painel', 'site'] as const;

export const useSitePainel = () =>
  useQuery({ queryKey: SITE_PAINEL_QUERY_KEY, queryFn: () => api.get<SitePainel>('/painel/site') });

/** Toda edição devolve o site inteiro: grava no cache do painel e invalida a visão pública. */
export function useEditarSite<V>(fn: (vars: V) => Promise<SitePainel>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (site) => {
      queryClient.setQueryData(SITE_PAINEL_QUERY_KEY, site);
      void queryClient.invalidateQueries({ queryKey: SITE_PUBLICO_QUERY_KEY });
    },
  });
}

export type DadosLocal = Partial<Omit<LocalConvite, 'tipo'>>;

export const useAtualizarLocal = () =>
  useEditarSite(({ tipo, ...dados }: DadosLocal & { tipo: TipoLocal }) => api.put<SitePainel>(`/painel/site/locais/${tipo}`, dados));

export const useAtualizarConfig = () =>
  useEditarSite((dados: Record<string, unknown>) => api.put<SitePainel>('/painel/site/config', dados));

type Recurso = 'historia' | 'galeria' | 'faq';

export const useCriarItem = (r: Recurso) => useEditarSite((dados: object) => api.post<SitePainel>(`/painel/site/${r}`, dados));
export const useAtualizarItem = (r: Recurso) =>
  useEditarSite(({ id, ...dados }: { id: number } & Record<string, unknown>) => api.put<SitePainel>(`/painel/site/${r}/${id}`, dados));
export const useExcluirItem = (r: Recurso) => useEditarSite((id: number) => api.del<SitePainel>(`/painel/site/${r}/${id}`));
export const useOrdenar = (r: Recurso) => useEditarSite((ids: number[]) => api.put<SitePainel>(`/painel/site/${r}/ordem`, { ids }));

/** Troca a posição `i` com a vizinha (`delta` = -1 sobe, +1 desce). */
export function moverNaLista(ids: number[], i: number, delta: -1 | 1): number[] {
  const j = i + delta;
  if (j < 0 || j >= ids.length) return ids;
  const novo = [...ids];
  [novo[i], novo[j]] = [novo[j]!, novo[i]!];
  return novo;
}
