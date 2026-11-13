import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Funcao } from '../convidados/useConvidados';

export interface EnvolvidoView {
  tipo: 'convidado' | 'funcao' | 'texto';
  rotulo: string;
  nomes: string[];
  convidadoId: number | null;
  funcao: Funcao | null;
  texto: string | null;
}

export interface Etapa {
  id: number;
  horario: string;
  horarioFim: string | null;
  titulo: string;
  descricao: string;
  localId: number | null;
  localTexto: string;
  local: { id: number; tipo: 'cerimonia' | 'festa'; nome: string; endereco: string; latitude: number | null; longitude: number | null } | null;
  envolvidos: EnvolvidoView[];
}

export interface Roteiro {
  data: string;
  etapas: Etapa[];
}

export type EnvolvidoInput = { convidadoId: number } | { funcao: Funcao } | { texto: string };

export const ROTEIRO_KEY = ['painel', 'roteiro'] as const;

export const useRoteiro = () => useQuery({ queryKey: ROTEIRO_KEY, queryFn: () => api.get<Roteiro>('/painel/roteiro') });

export function useEditarRoteiro<V>(fn: (v: V) => Promise<Roteiro>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: (r) => queryClient.setQueryData(ROTEIRO_KEY, r) });
}

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Dia e hora em São Paulo: `{ dia: 'YYYY-MM-DD', hora: 'HH:MM' }`. */
export function agoraEmSaoPaulo(now: Date): { dia: string; hora: string } {
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
}

/**
 * No dia do casamento: "agora" é a última etapa já iniciada; "próxima" é a seguinte.
 * Fora do dia, nenhum destaque.
 */
export function destaques(etapas: Etapa[], data: string, now: Date): { agora: number | null; proxima: number | null } {
  const { dia, hora } = agoraEmSaoPaulo(now);
  if (dia !== data) return { agora: null, proxima: null };
  const ordenadas = [...etapas].sort((a, b) => a.horario.localeCompare(b.horario));
  let i = -1;
  ordenadas.forEach((e, k) => {
    if (e.horario <= hora) i = k;
  });
  return { agora: i >= 0 ? ordenadas[i]!.id : null, proxima: ordenadas[i + 1]?.id ?? null };
}

export function linkMapa(l: NonNullable<Etapa['local']>): string | null {
  if (l.latitude !== null && l.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.latitude},${l.longitude}`)}`;
  }
  return l.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.endereco)}` : null;
}
