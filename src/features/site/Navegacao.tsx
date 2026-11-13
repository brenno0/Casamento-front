import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  inicialNoiva: string;
  inicialNoivo: string;
  secoes: [id: string, label: string][];
}

/**
 * Barra do site: transparente no topo, papel ao rolar. No desktop, links em versalete
 * com a seção atual sublinhada; no celular, um botão "Menu" abre a lista em tela cheia.
 */
export function Navegacao({ inicialNoiva, inicialNoivo, secoes }: Props) {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Seção atual: a que cruza a faixa logo abaixo da barra.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setAtual(e.target.id)),
      { rootMargin: '-20% 0px -70% 0px' },
    );
    secoes.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [secoes]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [aberto]);

  return (
    <nav
      aria-label="Seções"
      className={`sticky top-0 z-40 transition-[background-color,border-color] duration-300 ${
        rolou ? 'border-b border-folha bg-linho/90 backdrop-blur-sm' : 'border-b border-transparent bg-linho'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-gutter">
        <a href="#topo" aria-label="Voltar ao topo" className="shrink-0 font-display text-2xl text-verde">
          {inicialNoiva}
          <span className="mx-1 font-caslon text-lg text-musgo italic">&amp;</span>
          {inicialNoivo}
        </a>

        <ul className="hidden gap-8 lg:flex">
          {secoes.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={atual === id ? 'true' : undefined}
                className={`versalete relative py-2 text-[0.75rem] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-verde after:transition-transform after:duration-500 hover:text-verde ${
                  atual === id ? 'text-verde after:scale-x-100' : 'text-verde-suave after:scale-x-0'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-expanded={aberto}
          aria-controls="menu-secoes"
          className="versalete flex items-center gap-3 py-2 text-[0.75rem] text-verde lg:hidden"
        >
          Menu
          <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
            <span className="h-px bg-verde" />
            <span className="h-px bg-verde" />
          </span>
        </button>
      </div>

      {aberto &&
        createPortal(
        <div id="menu-secoes" className="fixed inset-0 z-50 flex animate-[surgir_0.4s_var(--ease-saida)_both] flex-col bg-linho px-gutter lg:hidden">
          <div className="flex h-16 items-center justify-between">
            <span className="font-display text-2xl text-verde">
              {inicialNoiva}
              <span className="mx-1 font-caslon text-lg text-musgo italic">&amp;</span>
              {inicialNoivo}
            </span>
            <button type="button" onClick={() => setAberto(false)} className="versalete py-2 text-[0.75rem] text-verde">
              Fechar
            </button>
          </div>
          <ul className="mt-10 space-y-5 border-t border-folha pt-10">
            {secoes.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={() => setAberto(false)} className="font-caslon text-3xl text-verde">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>,
          document.body,
        )}
    </nav>
  );
}
