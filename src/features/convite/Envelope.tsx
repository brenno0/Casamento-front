import { useRef, useState } from 'react';
import { prefereMenosMovimento } from '../../lib/motion';
import { marcarAberto } from './envelopeStorage';

/**
 * Abertura do convite: envelope com o nome do grupo que abre ao toque (AnimeJS).
 * Sem animação quando o usuário prefere menos movimento.
 */
export function Envelope({ token, nomeGrupo, onAberto }: { token: string; nomeGrupo: string; onAberto: () => void }) {
  const aba = useRef<HTMLDivElement>(null);
  const cartao = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const [abrindo, setAbrindo] = useState(false);

  function concluir() {
    marcarAberto(token);
    onAberto();
  }

  async function abrir() {
    if (abrindo) return;
    setAbrindo(true);
    if (prefereMenosMovimento()) return concluir();
    try {
      const { animate } = await import('animejs');
      await animate(aba.current!, { rotateX: 180, duration: 700, ease: 'inOutQuad' });
      await animate(cartao.current!, { translateY: -140, duration: 600, ease: 'outBack' });
      await animate(raiz.current!, { opacity: 0, duration: 450, ease: 'linear' });
    } catch {
      // Sem animação: segue direto para o site.
    }
    concluir();
  }

  return (
    <div ref={raiz} role="dialog" aria-modal="true" aria-label={`Convite para ${nomeGrupo}`} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-marfim px-gutter">
      <button
        type="button"
        onClick={() => void abrir()}
        aria-label="Abrir convite"
        className="relative h-56 w-80 max-w-full [perspective:800px] focus-visible:outline-2"
      >
        {/* Cartão que sobe de dentro do envelope */}
        <div ref={cartao} className="absolute inset-x-6 top-6 bottom-4 rounded-md bg-white shadow-suave">
          <p className="mt-6 font-script text-3xl text-rosa-antigo-escuro">Você está convidado</p>
        </div>
        {/* Corpo do envelope */}
        <div className="absolute inset-0 rounded-md border border-dourado bg-rosa-antigo-claro shadow-suave" style={{ clipPath: 'polygon(0 35%, 50% 70%, 100% 35%, 100% 100%, 0 100%)' }} />
        {/* Aba */}
        <div
          ref={aba}
          className="absolute inset-x-0 top-0 h-1/2 origin-top bg-rosa-antigo"
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transformStyle: 'preserve-3d' }}
        />
        {/* Selo */}
        <span className="absolute top-[42%] left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-dourado font-script text-xl text-white shadow-suave">
          N&amp;B
        </span>
      </button>
      <p className="mt-8 text-sm tracking-[0.3em] text-salvia-escuro uppercase">Para</p>
      <h1 className="mt-2 text-center font-script text-5xl text-rosa-antigo-escuro">{nomeGrupo}</h1>
      <p className="mt-6 text-grafite-suave">Toque no envelope para abrir</p>
      <button type="button" onClick={concluir} className="mt-4 text-sm text-grafite-suave underline">
        Pular
      </button>
    </div>
  );
}
