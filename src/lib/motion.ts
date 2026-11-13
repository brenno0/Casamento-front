/** Usuário pediu menos movimento (ou ambiente sem `matchMedia`, como testes). */
export function prefereMenosMovimento(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
