import { useEffect, type RefObject } from 'react';

/** Usuário pediu menos movimento (ou ambiente sem `matchMedia`, como testes). */
export function prefereMenosMovimento(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Revela com GSAP ScrollTrigger os elementos `[data-reveal]` dentro de `ref` ao rolar.
 * Sem animação quando o usuário prefere menos movimento. GSAP é carregado sob demanda.
 */
export function useRevelarAoRolar(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz || prefereMenosMovimento()) return;
    let desfazer: (() => void) | undefined;
    let cancelado = false;
    void (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
        if (cancelado) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>('[data-reveal]', raiz).forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 24,
              duration: 1,
              ease: 'expo.out',
              scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            });
          });
        }, raiz);
        desfazer = () => ctx.revert();
      } catch {
        // Sem animação; o conteúdo continua visível.
      }
    })();
    return () => {
      cancelado = true;
      desfazer?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
