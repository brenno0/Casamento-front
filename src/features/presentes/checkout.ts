import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface Taxas {
  disponivel: boolean;
  pixPct: number;
  cartaoPct: number;
}

/** Mesma conta do servidor: cobrado = ceil(valor / (1 − pct/100)). Só para exibir. */
export function calcularCobranca(valorCentavos: number, pct: number) {
  const cobradoCentavos = Math.ceil(valorCentavos / (1 - pct / 100));
  return { cobradoCentavos, taxaCentavos: cobradoCentavos - valorCentavos };
}

export const TAXAS_QUERY_KEY = ['publico', 'checkout', 'taxas'] as const;

export function useTaxas() {
  return useQuery({ queryKey: TAXAS_QUERY_KEY, queryFn: () => api.get<Taxas>('/publico/checkout/taxas'), staleTime: 5 * 60_000 });
}

/** Leva o navegador ao checkout (separado para os testes). */
export const navegador = { ir: (url: string) => window.location.assign(url) };
