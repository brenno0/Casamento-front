import { gsap } from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { prefereMenosMovimento } from '../../lib/motion';

const comoTexto = (n: number) => String(n);

/**
 * Número que sobe até `valor` com GSAP. Mexe só no nó de texto que o React já criou,
 * então não há re-render por quadro e o React continua dono do conteúdo.
 */
export function Contador({ valor, formatar = comoTexto }: { valor: number; formatar?: (n: number) => string }) {
  const el = useRef<HTMLSpanElement>(null);
  const anterior = useRef(0);

  useLayoutEffect(() => {
    const texto = el.current?.firstChild;
    const de = anterior.current;
    if (!texto || prefereMenosMovimento() || de === valor) {
      anterior.current = valor;
      return;
    }

    const estado = { n: de };
    texto.nodeValue = formatar(de);
    const tween = gsap.to(estado, {
      n: valor,
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => {
        texto.nodeValue = formatar(Math.round(estado.n));
      },
      // Só aqui: no StrictMode o efeito roda duas vezes e a segunda ainda deve animar.
      onComplete: () => {
        anterior.current = valor;
      },
    });
    return () => {
      tween.kill();
      texto.nodeValue = formatar(valor);
    };
  }, [valor, formatar]);

  return <span ref={el}>{formatar(valor)}</span>;
}
