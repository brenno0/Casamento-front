import { animate } from 'animejs';
import { useRef, useState } from 'react';
import { prefereMenosMovimento } from '../../lib/motion';
import { marcarAberto } from './envelopeStorage';

/**
 * Abertura do convite: o marcador de lugar com o nome do grupo, dobrado sobre a mesa,
 * que se abre ao toque (AnimeJS). Sem animação quando o usuário prefere menos movimento.
 */
export function Envelope({ token, nomeGrupo, onAberto }: { token: string; nomeGrupo: string; onAberto: () => void }) {
  const capa = useRef<HTMLDivElement>(null);
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
      await animate(capa.current!, { rotateX: 180, duration: 1000, ease: 'inOutCubic' });
      await animate(raiz.current!, { opacity: 0, duration: 500, delay: 350, ease: 'linear' });
    } catch {
      // Sem animação: segue direto para o site.
    }
    concluir();
  }

  return (
    <div ref={raiz} role="dialog" aria-modal="true" aria-label={`Convite para ${nomeGrupo}`} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-linho px-gutter">
      <div onClick={() => void abrir()} className="relative w-full max-w-md cursor-pointer [perspective:1200px]">
        {/* Dentro do cartão */}
        <div className="cartao-mesa flex aspect-[3/2] items-center justify-center px-10 text-center">
          <p className="font-caslon text-2xl text-verde italic sm:text-3xl">Você está convidado</p>
        </div>
        {/* Capa com o nome, que levanta ao abrir */}
        <div ref={capa} className="cartao-mesa absolute inset-0 flex origin-top flex-col items-center justify-center px-10 text-center [backface-visibility:hidden]">
          <p className="text-lg text-verde-suave">Para</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{nomeGrupo}</h1>
          <p className="mt-8 font-display text-xl text-musgo">
            N <span className="font-caslon text-base italic">&amp;</span> B
          </p>
        </div>
      </div>
      <button type="button" onClick={() => void abrir()} disabled={abrindo} className="botao mt-12">
        Abrir convite
      </button>
      <button type="button" onClick={concluir} className="mt-5 px-4 py-2 text-verde-suave underline">
        Pular
      </button>
    </div>
  );
}
