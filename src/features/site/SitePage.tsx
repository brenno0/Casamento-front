import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatDataCurta, formatDataExtenso } from '../../lib/date';
import { useRevelarAoRolar } from '../../lib/motion';
import { MapaLocal } from './MapaLocal';
import {
  instanteCerimonia,
  LABEL_LOCAL,
  linksMapa,
  tempoRestante,
  type LocalConvite,
  type LocalPublico,
  type SiteConvite,
  type SitePublico,
} from './useSite';

/** Conteúdo das seções que outras histórias preenchem (envelope, RSVP, presentes, mural). */
export interface SlotsSite {
  rsvp?: ReactNode;
  presentes?: ReactNode;
  mural?: ReactNode;
}

type Props =
  | { camada: 'publico'; site: SitePublico; slots?: SlotsSite; aviso?: ReactNode }
  | { camada: 'convite'; site: SiteConvite; slots?: SlotsSite; aviso?: ReactNode };

const ehConvite = (l: LocalPublico | LocalConvite): l is LocalConvite => 'endereco' in l;

export function SitePage(props: Props) {
  const { site, camada, slots = {}, aviso } = props;
  const raiz = useRef<HTMLElement>(null);
  useRevelarAoRolar(raiz, [site]);
  const convite = camada === 'convite';

  const secoes: [string, string, boolean][] = [
    ['historia', 'Nossa história', site.historia.length > 0],
    ['locais', 'Cerimônia e festa', true],
    ['dress-code', 'Dress code', true],
    ['rsvp', 'Confirmar presença', convite],
    ['presentes', 'Presentes', true],
    ['galeria', 'Galeria', site.galeria.length > 0],
    ['mural', 'Mural', convite],
    ['faq', 'Dúvidas', site.faq.length > 0],
  ];

  return (
    <main ref={raiz} className="bg-marfim text-grafite">
      <nav aria-label="Seções" className="sticky top-0 z-40 overflow-x-auto border-b border-dourado-claro bg-marfim/90 backdrop-blur">
        <ul className="mx-auto flex max-w-5xl gap-4 px-gutter py-2 text-sm whitespace-nowrap">
          {secoes
            .filter(([, , mostrar]) => mostrar)
            .map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-grafite-suave hover:text-rosa-antigo-escuro">
                  {label}
                </a>
              </li>
            ))}
        </ul>
      </nav>

      {aviso}

      <Hero site={site} saudacao={convite ? (props.site as SiteConvite).grupo : undefined} />

      {site.historia.length > 0 && (
        <Secao id="historia" titulo="Nossa história">
          <ol className="relative mx-auto max-w-3xl border-l border-dourado pl-8">
            {site.historia.map((h) => (
              <li key={h.id} data-reveal className="mb-12">
                <span aria-hidden="true" className="absolute -left-1.5 mt-2 h-3 w-3 rounded-full bg-rosa-antigo" />
                <p className="text-sm tracking-widest text-salvia-escuro uppercase">{formatDataCurta(h.data)}</p>
                <h3 className="mt-1 text-3xl">{h.titulo}</h3>
                {h.fotoUrl && (
                  <img src={h.fotoUrl} alt={h.titulo} loading="lazy" className="mt-4 w-full rounded-card object-cover shadow-suave" />
                )}
                {h.texto && <p className="mt-3 whitespace-pre-line">{h.texto}</p>}
              </li>
            ))}
          </ol>
        </Secao>
      )}

      <Secao id="locais" titulo="Cerimônia e festa">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {site.locais.map((l) => (
            <article key={l.tipo} data-reveal aria-label={LABEL_LOCAL[l.tipo]} className="rounded-card border border-dourado-claro bg-white p-6 text-center shadow-suave">
              <p className="text-sm tracking-[0.3em] text-salvia-escuro uppercase">{LABEL_LOCAL[l.tipo]}</p>
              <h3 className="mt-2 text-3xl">{l.nome}</h3>
              <p className="mt-2">
                {formatDataExtenso(l.data)} · {l.horario.replace(':', 'h')}
              </p>
              {ehConvite(l) && <DetalhesLocal l={l} />}
            </article>
          ))}
        </div>
        {!convite && (
          <p className="mt-6 text-center text-sm text-grafite-suave">
            Endereços e mapas estão no link do convite que você recebeu.
          </p>
        )}
      </Secao>

      <Secao id="dress-code" titulo="Dress code">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="whitespace-pre-line">{site.dressCode.texto}</p>
          {site.dressCode.paleta.length > 0 && (
            <ul aria-label="Paleta sugerida" className="mt-6 flex justify-center gap-3">
              {site.dressCode.paleta.map((cor) => (
                <li key={cor}>
                  <span aria-label={cor} title={cor} className="block h-12 w-12 rounded-full border border-dourado-claro shadow-suave" style={{ backgroundColor: cor }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Secao>

      {convite && (
        <Secao id="rsvp" titulo="Confirmar presença">
          {slots.rsvp ?? <p className="text-center text-grafite-suave">A confirmação de presença abre em breve.</p>}
        </Secao>
      )}

      <Secao id="presentes" titulo="Lista de presentes">
        {slots.presentes ?? <p className="text-center text-grafite-suave">A lista de presentes chega em breve.</p>}
      </Secao>

      {site.galeria.length > 0 && <Galeria fotos={site.galeria} />}

      {convite && (
        <Secao id="mural" titulo="Mural de recados">
          {slots.mural ?? <p className="text-center text-grafite-suave">O mural de recados abre em breve.</p>}
        </Secao>
      )}

      {site.faq.length > 0 && (
        <Secao id="faq" titulo="Dúvidas">
          <div className="mx-auto max-w-2xl space-y-3">
            {site.faq.map((f) => (
              <details key={f.id} data-reveal className="rounded-card border border-dourado-claro bg-white p-4">
                <summary className="cursor-pointer text-xl">{f.pergunta}</summary>
                <p className="mt-2 whitespace-pre-line">{f.resposta}</p>
              </details>
            ))}
          </div>
        </Secao>
      )}

      <footer className="py-12 text-center">
        <p className="font-script text-4xl text-rosa-antigo-escuro">
          {site.casal.nomeNoiva} &amp; {site.casal.nomeNoivo}
        </p>
      </footer>
    </main>
  );
}

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-12 px-gutter py-section odd:bg-marfim-escuro/40">
      <h2 id={`${id}-titulo`} data-reveal className="mb-10 text-center font-script text-5xl text-rosa-antigo-escuro sm:text-6xl">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Hero({ site, saudacao }: { site: SitePublico | SiteConvite; saudacao?: { nome: string; mensagem: string | null } }) {
  return (
    <header className="flex min-h-[85svh] flex-col items-center justify-center px-gutter py-section text-center">
      {saudacao && <p className="mb-4 text-lg text-salvia-escuro">Olá, {saudacao.nome}!</p>}
      <p className="text-sm tracking-[0.3em] text-salvia-escuro uppercase">Vamos nos casar</p>
      <h1 className="mt-6 font-script text-6xl leading-tight text-rosa-antigo-escuro sm:text-8xl">
        {site.casal.nomeNoiva} &amp; {site.casal.nomeNoivo}
      </h1>
      <div aria-hidden="true" className="mx-auto mt-6 h-px w-24 bg-dourado" />
      <p className="mt-6 text-2xl sm:text-3xl">
        <time dateTime={site.casal.dataCasamento}>{formatDataExtenso(site.casal.dataCasamento)}</time>
      </p>
      <Contagem dataCasamento={site.casal.dataCasamento} horario={site.locais[0]?.horario} />
      {saudacao?.mensagem && <p className="mx-auto mt-8 max-w-xl whitespace-pre-line italic">{saudacao.mensagem}</p>}
    </header>
  );
}

export function Contagem({ dataCasamento, horario }: { dataCasamento: string; horario?: string }) {
  const alvo = instanteCerimonia(dataCasamento, horario);
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = tempoRestante(alvo, agora);
  if (t.chegou) return <p className="mt-8 text-2xl text-salvia-escuro">É hoje!</p>;
  const partes: [number, string][] = [
    [t.dias, 'dias'],
    [t.horas, 'horas'],
    [t.minutos, 'min'],
    [t.segundos, 'seg'],
  ];
  return (
    <div role="timer" aria-label="Contagem regressiva" className="mt-8 flex gap-4 sm:gap-8">
      {partes.map(([n, rotulo]) => (
        <div key={rotulo} className="min-w-14 text-center">
          <span className="block text-4xl tabular-nums sm:text-5xl">{n}</span>
          <span className="text-sm tracking-widest text-grafite-suave uppercase">{rotulo}</span>
        </div>
      ))}
    </div>
  );
}

function DetalhesLocal({ l }: { l: LocalConvite }) {
  const links = linksMapa(l);
  return (
    <div className="mt-4">
      {l.endereco && <p className="text-grafite-suave">{l.endereco}</p>}
      {l.latitude !== null && l.longitude !== null && <MapaLocal latitude={l.latitude} longitude={l.longitude} nome={l.nome} />}
      {links && (
        <div className="mt-4 flex justify-center gap-3">
          <a href={links.google} target="_blank" rel="noreferrer" className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim">
            Google Maps
          </a>
          <a href={links.waze} target="_blank" rel="noreferrer" className="rounded-pill border border-rosa-antigo-escuro px-4 py-2 text-rosa-antigo-escuro">
            Waze
          </a>
        </div>
      )}
    </div>
  );
}

function Galeria({ fotos }: { fotos: { id: number; fotoUrl: string; legenda: string }[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const atual = fotos.find((f) => f.id === aberta);
  useEffect(() => {
    if (aberta === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aberta]);
  return (
    <Secao id="galeria" titulo="Galeria">
      <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((f) => (
          <li key={f.id} data-reveal>
            <button type="button" onClick={() => setAberta(f.id)} className="block w-full overflow-hidden rounded-card">
              <img src={f.fotoUrl} alt={f.legenda || 'Foto do casal'} loading="lazy" className="aspect-square w-full object-cover transition-transform hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      {atual && (
        <div role="dialog" aria-modal="true" aria-label={atual.legenda || 'Foto'} className="fixed inset-0 z-50 flex items-center justify-center bg-grafite/80 p-4" onClick={() => setAberta(null)}>
          <figure className="max-h-full max-w-4xl">
            <img src={atual.fotoUrl} alt={atual.legenda || 'Foto do casal'} className="max-h-[80svh] rounded-card object-contain" />
            {atual.legenda && <figcaption className="mt-2 text-center text-marfim">{atual.legenda}</figcaption>}
          </figure>
        </div>
      )}
    </Secao>
  );
}
