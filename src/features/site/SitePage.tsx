import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { formatDataCurta, formatDataExtenso } from '../../lib/date';
import { useRevelarAoRolar } from '../../lib/motion';
import { CAPITULOS, DUVIDAS, FOTO_CAPA, GALERIA_FIXA, IGREJA_AQUARELA } from './conteudo';
import { MapaLocal } from './MapaLocal';
import { Navegacao } from './Navegacao';
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
  // Fotos do casal vivem no código; a galeria do painel entra depois delas.
  const galeria = [...GALERIA_FIXA, ...site.galeria];
  const historia = site.historia.map((h, i) => {
    const c = CAPITULOS[i];
    return c ? { ...h, fotoUrl: c.fotoUrl, titulo: c.titulo ?? h.titulo, data: c.data ?? h.data, texto: c.texto ?? h.texto } : h;
  });

  const secoes: [string, string, boolean][] = [
    ['historia', 'Nossa história', site.historia.length > 0],
    ['locais', 'Cerimônia e festa', true],
    ['dress-code', 'Dress code', true],
    ['rsvp', 'Confirmar presença', convite],
    ['presentes', 'Presentes', true],
    ['galeria', 'Galeria', true],
    ['mural', 'Mural', convite],
    ['faq', 'Dúvidas', true],
  ];

  return (
    <main ref={raiz} id="topo" className="bg-linho text-tinta">
      <Navegacao
        inicialNoiva={site.casal.nomeNoiva.charAt(0)}
        inicialNoivo={site.casal.nomeNoivo.charAt(0)}
        secoes={secoes.filter(([, , mostrar]) => mostrar).map(([id, label]) => [id, label])}
      />

      {aviso}

      <Hero site={site} saudacao={convite ? (props.site as SiteConvite).grupo : undefined} />

      {site.historia.length > 0 && (
        <Secao id="historia" titulo="Nossa história" largo>
          <ol className="space-y-24 md:space-y-32">
            {historia.map((h, i) => (
              <li key={h.id} className={`grid items-center gap-8 md:gap-16 ${h.fotoUrl ? 'md:grid-cols-12' : ''}`}>
                {h.fotoUrl && (
                  <figure data-reveal className={`w-full max-w-xs justify-self-center bg-papel p-3 shadow-suave md:col-span-4 ${i % 2 ? 'md:order-2 md:col-start-9' : ''}`}>
                    <img src={h.fotoUrl} alt={h.titulo} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                  </figure>
                )}
                <div className={h.fotoUrl ? `md:col-span-7 ${i % 2 ? 'md:col-start-2' : 'md:col-start-6'}` : 'max-w-2xl'}>
                  <h3 className="text-3xl sm:text-4xl">{h.titulo}</h3>
                  <p className="versalete mt-3 text-musgo">{dataCapitulo(h.data)}</p>
                  {h.texto && <p className="mt-6 max-w-[60ch] text-lg whitespace-pre-line">{h.texto}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Secao>
      )}

      <figure aria-hidden="true" className="-mb-px px-gutter pt-8">
        <img src={IGREJA_AQUARELA} alt="" loading="lazy" data-reveal className="aquarela mx-auto block w-full max-w-5xl" />
      </figure>

      <Secao id="locais" titulo="Cerimônia e festa" tom="verde" largo>
        <div className="grid gap-16 md:grid-cols-2 md:gap-0 md:divide-x md:divide-linho/20">
          {site.locais.map((l, i) => (
            <article key={l.tipo} aria-label={LABEL_LOCAL[l.tipo]} className={i === 0 ? 'md:pr-16' : 'md:pl-16'}>
              <p className="font-display text-6xl leading-none text-vela sm:text-7xl">{l.horario.replace(':', 'h')}</p>
              <h3 className="mt-6 text-3xl text-linho">{l.nome}</h3>
              <p className="mt-2 text-linho/80">
                {LABEL_LOCAL[l.tipo]} · {formatDataExtenso(l.data)}
              </p>
              {ehConvite(l) && <DetalhesLocal l={l} />}
            </article>
          ))}
        </div>
        {!convite && <p className="mt-16 text-linho/80">Endereços e mapas estão no link do convite que você recebeu.</p>}
      </Secao>

      <Secao id="dress-code" titulo="Dress code">
        <p className="max-w-[40ch] font-caslon text-2xl leading-relaxed whitespace-pre-line text-verde">{site.dressCode.texto}</p>
        {site.dressCode.paleta.length > 0 && (
          <ul aria-label="Paleta sugerida" className="mt-10 flex flex-wrap gap-4">
            {site.dressCode.paleta.map((cor) => (
              <li key={cor}>
                <span aria-label={cor} title={cor} className="block h-24 w-16 rounded-card shadow-suave" style={{ backgroundColor: cor }} />
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {convite && (
        <Secao id="rsvp" titulo="Confirmar presença" tom="papel">
          {slots.rsvp ?? <p className="text-verde-suave">A confirmação de presença abre em breve.</p>}
        </Secao>
      )}

      <Secao id="presentes" titulo="Lista de presentes" largo>
        {slots.presentes ?? <p className="text-verde-suave">A lista de presentes chega em breve.</p>}
      </Secao>

      <Galeria fotos={galeria} />

      {convite && (
        <Secao id="mural" titulo="Mural de recados" tom="papel">
          {slots.mural ?? <p className="text-verde-suave">O mural de recados abre em breve.</p>}
        </Secao>
      )}

      <Secao id="faq" titulo="Dúvidas">
        <div className="border-t border-folha-escuro">
          {DUVIDAS.map((f) => (
            <details key={f.id} className="group border-b border-folha-escuro">
              <summary className="flex list-none items-center justify-between gap-6 py-6 font-caslon text-xl text-verde [&::-webkit-details-marker]:hidden">
                {f.pergunta}
                <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-verde" />
                  <span className="absolute inset-y-0 left-1/2 w-px bg-verde transition-transform duration-300 group-open:rotate-90" />
                </span>
              </summary>
              <p className="max-w-[65ch] pb-8 whitespace-pre-line text-verde-suave">{f.resposta}</p>
            </details>
          ))}
        </div>
      </Secao>

      <footer className="bg-verde px-gutter py-24 text-center text-linho">
        <p className="font-display text-5xl sm:text-6xl">
          {site.casal.nomeNoiva} <span className="font-caslon text-4xl text-vela italic">&amp;</span> {site.casal.nomeNoivo}
        </p>
        <p className="versalete mt-6 text-linho/80">{formatDataCurta(site.casal.dataCasamento).replaceAll('/', ' · ')}</p>
      </footer>
    </main>
  );
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Data do capítulo: `AAAA-MM` vira "julho de 2019"; data completa vira dd/mm/aaaa. */
function dataCapitulo(data: string): string {
  const mes = /^(\d{4})-(\d{2})$/.exec(data);
  return mes ? `${MESES[Number(mes[2]) - 1]} de ${mes[1]}` : formatDataCurta(data);
}

const TONS = {
  linho: 'bg-linho',
  papel: 'bg-papel',
  verde: 'sobre-verde bg-verde text-linho',
} as const;

function Secao({
  id,
  titulo,
  tom = 'linho',
  largo = false,
  children,
}: {
  id: string;
  titulo: string;
  tom?: keyof typeof TONS;
  largo?: boolean;
  children: ReactNode;
}) {
  const h2 = (
    <h2 id={`${id}-titulo`} className={`text-4xl sm:text-5xl ${tom === 'verde' ? 'text-linho' : ''}`}>
      {titulo}
    </h2>
  );
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={`scroll-mt-14 px-gutter py-24 md:py-section ${TONS[tom]}`}>
      {largo ? (
        <div className="mx-auto max-w-6xl">
          {h2}
          <div className="mt-14 md:mt-20">{children}</div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">{h2}</div>
          </div>
          <div className="min-w-0 lg:col-span-8">{children}</div>
        </div>
      )}
    </section>
  );
}

function Hero({ site, saudacao }: { site: SitePublico | SiteConvite; saudacao?: { nome: string; mensagem: string | null } }) {
  const capa = FOTO_CAPA;
  const linha = 'block overflow-hidden pb-[0.12em]';
  const sobe = 'block animate-[subir_1s_var(--ease-saida)_both]';
  return (
    <header className="px-gutter pt-16 pb-24 md:pt-24 md:pb-section">
      <div className={`mx-auto grid max-w-6xl items-center gap-16 ${capa ? 'lg:grid-cols-12' : ''}`}>
        <div className={capa ? 'lg:col-span-7' : ''}>
          <h1 className="text-[clamp(3.5rem,14vw,6rem)] leading-[0.98]">
            <span className={linha}>
              <span className={sobe}>{site.casal.nomeNoiva}</span>
            </span>{' '}
            <span className={linha}>
              <span className={`${sobe} [animation-delay:120ms]`}>
                <span className="font-caslon text-[0.7em] text-musgo italic">&amp;</span> {site.casal.nomeNoivo}
              </span>
            </span>
          </h1>

          <div className="mt-10 animate-[surgir_0.9s_var(--ease-saida)_0.35s_both] border-t border-folha-escuro pt-8">
            <p className="font-caslon text-2xl text-verde sm:text-3xl">
              <time dateTime={site.casal.dataCasamento}>{formatDataExtenso(site.casal.dataCasamento)}</time>
            </p>
            <p className="mt-1 text-lg text-verde-suave">Vamos nos casar</p>
            <Contagem dataCasamento={site.casal.dataCasamento} horario={site.locais[0]?.horario} />
          </div>

          {saudacao && (
            <div className="cartao-mesa mt-12 max-w-xl animate-[surgir_0.9s_var(--ease-saida)_0.55s_both] px-8 py-10 sm:px-12">
              <p className="font-caslon text-2xl text-verde sm:text-3xl">Olá, {saudacao.nome}!</p>
              {saudacao.mensagem && <p className="mt-4 font-caslon text-lg whitespace-pre-line text-verde-suave italic">{saudacao.mensagem}</p>}
            </div>
          )}
        </div>

        {capa && (
          <figure className="animate-[surgir_1.1s_var(--ease-saida)_0.25s_both] bg-papel p-3 shadow-suave lg:col-span-5">
            <img src={capa.fotoUrl} alt={capa.legenda || 'Foto do casal'} className="aspect-[4/5] w-full object-cover" />
          </figure>
        )}
      </div>
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
  if (t.chegou) return <p className="mt-8 font-display text-5xl text-verde">É hoje!</p>;
  const partes: [number, string][] = [
    [t.dias, 'dias'],
    [t.horas, 'horas'],
    [t.minutos, 'min'],
    [t.segundos, 'seg'],
  ];
  return (
    <div role="timer" aria-label="Contagem regressiva" className="mt-8 flex gap-8 sm:gap-12">
      {partes.map(([n, rotulo]) => (
        <div key={rotulo}>
          <span className="block font-display text-4xl leading-none text-verde sm:text-5xl">{n}</span>
          <span className="mt-2 block text-sm text-verde-suave">{rotulo}</span>
        </div>
      ))}
    </div>
  );
}

function DetalhesLocal({ l }: { l: LocalConvite }) {
  const links = linksMapa(l);
  return (
    <div className="mt-6">
      {l.endereco && <p className="text-lg text-linho">{l.endereco}</p>}
      {l.latitude !== null && l.longitude !== null && <MapaLocal latitude={l.latitude} longitude={l.longitude} nome={l.nome} />}
      {links && (
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={links.google} target="_blank" rel="noreferrer" className="botao">
            Google Maps
          </a>
          <a href={links.waze} target="_blank" rel="noreferrer" className="botao-contorno">
            Waze
          </a>
        </div>
      )}
    </div>
  );
}

/** Inclinação de cada foto no varal, em graus. */
const GIROS = [-3, 2, -1.5, 3, -2.5, 1.5];

function Galeria({ fotos }: { fotos: { id: number; fotoUrl: string; legenda: string }[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const atual = fotos.find((f) => f.id === aberta);
  const varal = useRef<HTMLUListElement>(null);
  const rolar = (sentido: 1 | -1) => {
    const el = varal.current;
    if (el) el.scrollBy({ left: sentido * el.clientWidth * 0.8 });
  };
  useEffect(() => {
    if (aberta === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aberta]);
  return (
    <Secao id="galeria" titulo="Galeria" largo>
      <div className="relative -mx-gutter">
        {/* O varal: um fio levemente curvado atravessando a seção. */}
        <svg aria-hidden="true" viewBox="0 0 1000 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-3 h-10 w-full text-folha-escuro">
          <path d="M0 6 Q500 46 1000 6" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <ul
          ref={varal}
          aria-label="Fotos do casal"
          className="relative flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-gutter pt-6 pb-10 [scrollbar-width:none] sm:gap-10"
        >
          {fotos.map((f, i) => (
            <li key={f.id} className="polaroide shrink-0 snap-center" style={{ '--giro': `${GIROS[i % GIROS.length]}deg` } as CSSProperties}>
              <span aria-hidden="true" className="prendedor" />
              <button type="button" onClick={() => setAberta(f.id)} className="block w-56 bg-papel p-3 pb-4 text-left shadow-suave sm:w-64">
                <img src={f.fotoUrl} alt={f.legenda || 'Foto do casal'} loading="lazy" className="aspect-square w-full object-cover" />
                <span className="mt-3 block min-h-6 font-caslon text-verde-suave italic">{f.legenda}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={() => rolar(-1)} aria-label="Fotos anteriores" className="botao-contorno min-h-11 px-5">
          ←
        </button>
        <button type="button" onClick={() => rolar(1)} aria-label="Próximas fotos" className="botao-contorno min-h-11 px-5">
          →
        </button>
      </div>
      {atual && (
        <div role="dialog" aria-modal="true" aria-label={atual.legenda || 'Foto'} className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/90 p-4 sm:p-10" onClick={() => setAberta(null)}>
          <figure className="max-h-full max-w-4xl bg-papel p-3">
            <img src={atual.fotoUrl} alt={atual.legenda || 'Foto do casal'} className="max-h-[78svh] object-contain" />
            {atual.legenda && <figcaption className="px-1 pt-3 pb-1 font-caslon text-verde italic">{atual.legenda}</figcaption>}
          </figure>
        </div>
      )}
    </Secao>
  );
}
