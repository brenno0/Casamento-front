import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export type TipoLocal = 'cerimonia' | 'festa';

export interface LocalPublico {
  tipo: TipoLocal;
  nome: string;
  data: string;
  horario: string;
}

export interface LocalConvite extends LocalPublico {
  endereco: string;
  latitude: number | null;
  longitude: number | null;
}

interface SiteBase {
  casal: { nomeNoiva: string; nomeNoivo: string; dataCasamento: string };
  historia: { id: number; data: string; titulo: string; texto: string; fotoUrl: string | null }[];
  dressCode: { texto: string; paleta: string[] };
  galeria: { id: number; fotoUrl: string; legenda: string }[];
  faq: { id: number; pergunta: string; resposta: string }[];
}

export interface SitePublico extends SiteBase {
  locais: LocalPublico[];
}

export interface SiteConvite extends SiteBase {
  locais: LocalConvite[];
  grupo: { nome: string; mensagem: string | null };
}

export const SITE_PUBLICO_QUERY_KEY = ['publico', 'site'] as const;
export const siteConviteQueryKey = (token: string) => ['convite', token, 'site'] as const;

export function useSitePublico(habilitado = true) {
  return useQuery({
    queryKey: SITE_PUBLICO_QUERY_KEY,
    queryFn: () => api.get<SitePublico>('/publico/site'),
    enabled: habilitado,
  });
}

export function useSiteConvite(token: string) {
  return useQuery({
    queryKey: siteConviteQueryKey(token),
    queryFn: () => api.get<SiteConvite>(`/convite/${encodeURIComponent(token)}/site`),
    // Convite inexistente não melhora tentando de novo.
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1,
  });
}

export const LABEL_LOCAL: Record<TipoLocal, string> = { cerimonia: 'Cerimônia', festa: 'Festa' };

/** Links externos de navegação, por coordenadas quando houver, senão pelo endereço. */
export function linksMapa(l: LocalConvite): { google: string; waze: string } | null {
  if (l.latitude !== null && l.longitude !== null) {
    const ll = `${l.latitude},${l.longitude}`;
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ll)}`,
      waze: `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes`,
    };
  }
  if (l.endereco.trim()) {
    const q = encodeURIComponent(l.endereco);
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${q}`,
      waze: `https://waze.com/ul?q=${q}&navigate=yes`,
    };
  }
  return null;
}

/** Instante da cerimônia: 17/07/2027 16:00 em São Paulo (UTC−3, sem horário de verão). */
export function instanteCerimonia(dataCasamento: string, horario = '16:00'): Date {
  return new Date(`${dataCasamento}T${horario}:00-03:00`);
}

export function tempoRestante(alvo: Date, agora: Date) {
  const ms = Math.max(0, alvo.getTime() - agora.getTime());
  const s = Math.floor(ms / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    chegou: ms === 0,
  };
}
