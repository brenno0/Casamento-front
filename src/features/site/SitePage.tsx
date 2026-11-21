import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatDataCurta, formatDataExtenso } from '../../lib/date';
import { useAnimacoesSite } from './animacoes';
import { aquarela, IGREJA_AQUARELA } from './conteudo';
import { Icone, type NomeIcone } from './Icones';
import { MapaLocal } from './MapaLocal';
import { Navegacao } from './Navegacao';
import {
  instanteCerimonia,
  LABEL_LOCAL,
  linksMapa,
  tempoRestante,
  type LocalConvite,
  type LocalMapa,
  type LocalPublico,
  type SiteConvite,
  type SitePublico,
} from './useSite';

/** Conteúdo das seções que outras histórias preenchem (envelope, RSVP, mural). */
export interface SlotsSite {
  rsvp?: ReactNode;
  mural?: ReactNode;
}

type Props =
  | {
      camada: 'publico';
      site: SitePublico;
      slots?: SlotsSite;
      aviso?: ReactNode;
    }
  | {
      camada: 'convite';
      site: SiteConvite;
      slots?: SlotsSite;
      aviso?: ReactNode;
    };

const ehConvite = (l: LocalPublico | LocalConvite): l is LocalConvite => 'endereco' in l;

/** Memo: só refaz quando os dados do site ou os slots mudam (a coreografia inteira depende dele). */
export const SitePage = memo(function SitePage(props: Props) {
  const { site, camada, slots = {}, aviso } = props;
  const raiz = useRef<HTMLElement>(null);
  useAnimacoesSite(raiz, [site]);
  const convite = camada === 'convite';
  // Derivados memorizados: a página só recalcula quando os dados do site mudam.
  const { galeria, historia, visiveis, numeros, cerimonia } = useMemo(() => {
    // Só a cerimônia aparece no site: nem todo convidado vai à festa.
    const cerimonia = site.locais.filter((l) => l.tipo === 'cerimonia');
    const { galeria, historia } = site;
    const secoes: [string, string, boolean][] = [
      ['historia', 'Nossa história', historia.length > 0],
      ['locais', 'Cerimônia', cerimonia.length > 0],
      ['dress-code', 'Dress code', true],
      ['rsvp', 'Confirmar presença', convite],
      ['presentes', 'Presentes', site.listasPresentes.length > 0],
      ['galeria', 'Galeria', galeria.length > 0],
      ['mural', 'Mural', convite],
      ['faq', 'Dúvidas', site.faq.length > 0],
      ['como-chegar', 'Como chegar', site.comoChegar.some((l) => l.endereco.trim() !== '')],
    ];
    const visiveis = secoes.filter(([, , mostrar]) => mostrar).map(([id, label]): [string, string] => [id, label]);
    // Seções visíveis numeradas como num convite: I, II, III...
    const numeros = new Map(visiveis.map(([id], i) => [id, ROMANOS[i] ?? String(i + 1)]));
    return { galeria, historia, visiveis, numeros, cerimonia };
  }, [site, convite]);
  const n = (id: string) => numeros.get(id);

  return (
    <main ref={raiz} id="topo" className="textura-papel bg-linho text-tinta">
      <Navegacao
        inicialNoiva={site.casal.nomeNoiva.charAt(0)}
        inicialNoivo={site.casal.nomeNoivo.charAt(0)}
        secoes={visiveis}
      />

      {aviso}

      <Hero site={site} saudacao={convite ? (props.site as SiteConvite).grupo : undefined} />

      {historia.length > 0 && (
        <Secao id="historia" titulo="Nossa história" numero={n('historia')} icone="anel" largo>
          <div className="mb-24 md:mb-32">
            <EnvelopeCapa fotoUrl={site.capaUrl} legenda={`${site.casal.nomeNoiva} e ${site.casal.nomeNoivo}`} />
          </div>
          <ol data-linha-do-tempo className="relative space-y-24 pl-8 md:space-y-32 md:pl-14">
            {/* Fio da história: desenha-se com a rolagem, com um ponto em cada capítulo. */}
            <span data-linha aria-hidden="true" className="absolute top-3 bottom-3 left-[5px] w-px origin-top bg-folha-escuro md:left-[7px]" />
            {historia.map((h, i) => (
              <li key={h.id} className={`relative grid items-center gap-8 md:gap-16 ${h.fotoUrl ? 'md:grid-cols-12' : ''}`}>
                <span
                  data-ponto
                  aria-hidden="true"
                  className="absolute top-2 -left-8 h-[11px] w-[11px] md:top-1/2 md:-translate-y-1/2 rounded-full border border-verde bg-vela md:-left-14 md:h-[15px] md:w-[15px]"
                />
                {h.fotoUrl && (
                  <div data-parallax className={`w-full max-w-xs justify-self-center md:col-span-4 ${i % 2 ? 'md:order-2 md:col-start-9' : ''}`}>
                    <figure data-foto-historia className={`border border-ocre/60 p-2 ${MOLDURAS[i % MOLDURAS.length]}`}>
                      <img src={h.fotoUrl} alt={h.titulo} loading="lazy" decoding="async" className={`aspect-[4/5] w-full object-cover ${MOLDURAS[i % MOLDURAS.length]}`} />
                    </figure>
                  </div>
                )}
                <div data-reveal className={h.fotoUrl ? `md:col-span-7 ${i % 2 ? 'md:col-start-2' : 'md:col-start-6'}` : 'max-w-2xl'}>
                  {VINHETAS_CAPITULO[i] && <Aquarela arquivo={VINHETAS_CAPITULO[i]} className="mb-5 h-24 w-auto" />}
                  <h3 className="text-3xl sm:text-4xl">{h.titulo}</h3>
                  <p className="versalete mt-3 text-musgo">{dataCapitulo(h.data)}</p>
                  {h.texto && (
                    <p data-linhas className="mt-6 max-w-[60ch] text-lg whitespace-pre-line">
                      {h.texto}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Secao>
      )}

      <Secao id="locais" titulo="Cerimônia" numero={n('locais')} vinheta="v-cerimonia" largo>
        <div data-cardapio className="cartao-mesa cardapio mx-auto max-w-2xl px-8 py-14 text-center text-tinta sm:px-16 sm:py-16">
          <Aquarela arquivo="ramo-canto.webp" className="pointer-events-none absolute -top-12 -left-14 w-44 max-w-none sm:-top-16 sm:-left-20 sm:w-60" />
          <Aquarela arquivo="ramo-canto.webp" className="pointer-events-none absolute -right-14 -bottom-12 w-44 max-w-none rotate-180 sm:-right-20 sm:-bottom-16 sm:w-60" />
          <div className="relative mx-auto w-24">
            <Aquarela arquivo="lacre.webp" className="block w-full" />
            <p className="absolute inset-0 flex items-center justify-center gap-1 font-display text-lg text-verde">
              {site.casal.nomeNoiva.charAt(0)} <span className="font-caslon text-sm italic">&amp;</span> {site.casal.nomeNoivo.charAt(0)}
            </p>
          </div>
          <p className="versalete relative mt-5 text-verde-suave">{formatDataExtenso(site.casal.dataCasamento)}</p>
          <div className="relative mt-10 space-y-10">
            {cerimonia.map((l, i) => (
              <article key={l.tipo} aria-label={LABEL_LOCAL[l.tipo]}>
                {i > 0 && (
                  <p aria-hidden="true" className="mb-10 flex items-center justify-center gap-4 text-musgo">
                    <span data-filete className="h-px w-16 origin-right bg-folha-escuro" />
                    <span className="font-caslon text-xl italic">&amp;</span>
                    <span data-filete className="h-px w-16 origin-left bg-folha-escuro" />
                  </p>
                )}
                <p className="versalete flex items-center justify-center gap-2 text-musgo">
                  <Icone nome="relogio" className="h-4 w-4" />
                  {LABEL_LOCAL[l.tipo]}
                </p>
                <p data-contar={Number(l.horario.split(':')[0])} className="mt-3 font-display text-6xl leading-none text-verde tabular-nums">
                  {l.horario.replace(':', 'h')}
                </p>
                <h3 className="mt-4 text-2xl">{l.nome}</h3>
                {ehConvite(l) && <DetalhesLocal l={l} />}
              </article>
            ))}
          </div>
          {!convite && (
            <p className="mt-12 flex items-center justify-center gap-2 text-verde-suave">
              <Icone nome="alfinete" className="h-4 w-4" />
              <a href="#como-chegar" className="underline">
                Mapa e rotas no fim da página
              </a>
            </p>
          )}
        </div>
      </Secao>

      <Secao id="dress-code" titulo="Dress code" numero={n('dress-code')} vinheta="v-traje">
        <p data-linhas className="max-w-[40ch] font-caslon text-2xl leading-relaxed whitespace-pre-line text-verde">
          {site.dressCode.texto}
        </p>
        {site.dressCode.paleta.length > 0 && (
          <ul data-paleta aria-label="Paleta sugerida" className="mt-10 flex flex-wrap gap-4">
            {site.dressCode.paleta.map((cor) => (
              <li key={cor}>
                <span aria-label={cor} title={cor} className="block h-24 w-16 rounded-card shadow-suave transition-[translate] duration-500 ease-[var(--ease-saida)] hover:-translate-y-3" style={{ backgroundColor: cor }} />
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {convite && (
        <Secao id="rsvp" titulo="Confirmar presença" numero={n('rsvp')} icone="envelope">
          {convite && (
            <div data-reveal className="cartao-mesa mb-12 max-w-sm px-8 py-7 text-center">
              <p className="versalete text-musgo">Lugar reservado para</p>
              <p className="mt-2 font-caslon text-2xl text-verde">{(props.site as SiteConvite).grupo.nome}</p>
            </div>
          )}
          {slots.rsvp ?? <p className="text-verde-suave">A confirmação de presença abre em breve.</p>}
        </Secao>
      )}

      {site.listasPresentes.length > 0 && (
        <Secao id="presentes" titulo="Lista de presentes" numero={n('presentes')} vinheta="v-presentes">
          <ul data-cascata className="flex flex-wrap gap-3">
            {site.listasPresentes.map((l, i) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer noopener" className={i === 0 ? 'botao px-6' : 'botao-contorno px-6'}>
                  {l.titulo}
                </a>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {galeria.length > 0 && <Galeria fotos={galeria} numero={n('galeria')} />}

      {convite && (
        <Secao id="mural" titulo="Mural de recados" numero={n('mural')} icone="pena">
          {slots.mural ?? <p className="text-verde-suave">O mural de recados abre em breve.</p>}
        </Secao>
      )}

{site.faq.length > 0 && (
      <Secao id="faq" titulo="Dúvidas" numero={n('faq')} vinheta="v-duvidas" espelhado>
        <div data-cascata className="border-t border-folha-escuro">
          {site.faq.map((f) => (
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
      )}

      <ComoChegar locais={site.comoChegar} numero={n('como-chegar')} />

      <footer data-rodape className="borda-rasgada textura-papel-clara relative overflow-x-clip bg-papel pt-24 text-center">
        <div className="relative mx-auto max-w-3xl px-gutter">
          <Aquarela arquivo="arco-folhas.webp" className="mx-auto block w-full" />
          <div className="-mt-[24%]">
            <p data-rodape-nomes className="font-nomes text-4xl leading-[1.4] text-verde sm:text-5xl">
              {site.casal.nomeNoiva}{' '}
              <span data-rodape-e className="inline-block font-caslon text-2xl text-ocre italic">
                &amp;
              </span>{' '}
              {site.casal.nomeNoivo}
            </p>
            <p className="versalete mt-6 text-verde-suave">{formatDataCurta(site.casal.dataCasamento).replaceAll('/', ' · ')}</p>
          </div>
        </div>
        <Aquarela arquivo="rodape.webp" className="mx-auto mt-16 block w-full max-w-6xl" />
      </footer>
    </main>
  );
});

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Data do capítulo: `AAAA-MM` vira "julho de 2019"; data completa vira dd/mm/aaaa. */
function dataCapitulo(data: string): string {
  const mes = /^(\d{4})-(\d{2})$/.exec(data);
  return mes ? `${MESES[Number(mes[2]) - 1]} de ${mes[1]}` : formatDataCurta(data);
}

const TONS = { linho: 'textura-papel bg-linho', papel: 'textura-papel-clara bg-papel' } as const;

/** Recortes das fotos: arco e oval, nunca retângulo. */
const MOLDURAS = ['rounded-t-full', 'rounded-[50%]'];

/** Aquarela decorativa, com fundo transparente. */
function Aquarela({ arquivo, className }: { arquivo: string; className: string }) {
  return <img src={aquarela(arquivo)} alt="" aria-hidden="true" loading="lazy" decoding="async" className={className} />;
}

/** Vinheta de cada capítulo da história, na ordem: primeiro encontro, primeira viagem, o pedido. */
const VINHETAS_CAPITULO = ['v-encontro.webp', 'v-viagem.webp', 'v-pedido.webp'];

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function Secao({
  id,
  titulo,
  numero,
  icone,
  vinheta,
  largo = false,
  espelhado = false,
  children,
}: {
  id: string;
  titulo: string;
  numero?: string;
  icone?: NomeIcone;
  /** Aquarela da seção (arquivo sem extensão); toma o lugar do ícone. */
  vinheta?: string;
  largo?: boolean;
  /** Título à direita e conteúdo à esquerda, para quebrar o ritmo entre seções vizinhas. */
  espelhado?: boolean;
  children: ReactNode;
}) {
  // Só dois papéis, alternados na ordem das seções: vizinhas nunca têm o mesmo tom.
  const tom = ROMANOS.indexOf(numero ?? '') % 2 === 1 ? 'papel' : 'linho';
  const titulo_ = (
    <div className="relative">
      <Aquarela arquivo={tom === 'linho' ? 'mancha-verde.webp' : 'mancha-ocre.webp'} className="pointer-events-none absolute -top-12 -left-8 w-64 max-w-none opacity-55 sm:w-80" />
      {(numero || icone) && (
        <p data-reveal aria-hidden="true" className="versalete relative mb-5 flex items-center gap-3 text-musgo">
          {numero}
          <span className="h-px w-10 bg-current opacity-60" />
          {icone && !vinheta && <Icone nome={icone} className="h-5 w-5" />}
        </p>
      )}
      <h2 id={`${id}-titulo`} aria-label={titulo} data-titulo className="relative text-4xl sm:text-5xl">
        {titulo.split(' ').map((palavra, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span data-palavra className="inline-block">
                {palavra}
              </span>
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
  const h2 = (
    <div className={largo ? 'flex items-end justify-between gap-6' : ''}>
      {titulo_}
      {vinheta && <Aquarela arquivo={`${vinheta}.webp`} className={largo ? 'h-28 w-auto sm:h-40' : 'mt-10 h-32 w-auto lg:h-44'} />}
    </div>
  );
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={`borda-rasgada relative scroll-mt-14 overflow-x-clip px-gutter py-24 md:py-section ${TONS[tom]}`}>
      {tom === 'linho' && <Aquarela arquivo="divisor.webp" className="mx-auto -mt-10 mb-14 block w-48 md:-mt-16 md:mb-20 md:w-64" />}
      {largo ? (
        <div className="mx-auto max-w-6xl">
          {h2}
          <div className="mt-14 md:mt-20">{children}</div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 lg:gap-16">
          <div className={`lg:col-span-4 ${espelhado ? 'lg:order-last' : ''}`}>
            <div className="lg:sticky lg:top-28">{h2}</div>
          </div>
          <div className="min-w-0 lg:col-span-8">{children}</div>
        </div>
      )}
    </section>
  );
}

function Hero({ site, saudacao }: { site: SitePublico | SiteConvite; saudacao?: { nome: string; mensagem: string | null } }) {
  const linha = '-mx-[0.2em] -mt-[0.15em] -mb-[0.5em] block overflow-hidden px-[0.2em] pt-[0.3em] pb-[0.7em] md:inline-block escrita';
  return (
    <header data-hero className="overflow-hidden px-gutter">
      <div className="relative mx-auto flex h-[80svh] max-w-7xl items-center justify-center">
        <div aria-hidden="true" className="aquarela absolute inset-0 opacity-70">
          <img
            data-hero-igreja
            src={IGREJA_AQUARELA}
            alt=""
            width={1600}
            height={907}
            fetchPriority="high"
            className="aquarela-regioes block h-full w-full object-cover md:object-contain"
          />
        </div>
        <div data-hero-nomes className="nomes-sobre-aquarela relative mb-[8svh] flex flex-col items-center text-center">
          <h1 className="font-nomes text-[clamp(2.5rem,10vw,4.5rem)] leading-[1.15]">
            <span data-hero-escrita className={linha}>
              <span className="block">{site.casal.nomeNoiva}</span>
            </span>{' '}
            <span data-hero-escrita className={linha}>
              <span className="block">
                <span className="font-caslon text-[0.55em] text-verde italic">&amp;</span> {site.casal.nomeNoivo}
              </span>
            </span>
          </h1>
          <div data-hero-info className="mt-6 flex flex-col items-center">
            <p className="font-caslon text-xl tracking-[0.16em] text-verde sm:text-2xl">
              <time dateTime={site.casal.dataCasamento} aria-label={formatDataExtenso(site.casal.dataCasamento)}>
                {formatDataExtenso(site.casal.dataCasamento).replaceAll(' de ', '.').toUpperCase()}
              </time>
            </p>
            <span aria-hidden="true" className="mt-4 block h-px w-16 bg-ocre/70" />
            <Contagem dataCasamento={site.casal.dataCasamento} horario={site.locais.find((l) => l.tipo === 'cerimonia')?.horario} />
          </div>
        </div>
      </div>

      {saudacao && (
        <div data-hero-saudacao className="cartao-mesa mx-auto mt-10 max-w-xl px-8 py-10 text-center sm:px-12">
          <p className="font-caslon text-2xl text-verde sm:text-3xl">Olá, {saudacao.nome}!</p>
          {saudacao.mensagem && <p className="mt-4 font-caslon text-lg whitespace-pre-line text-verde-suave italic">{saudacao.mensagem}</p>}
        </div>
      )}
    </header>
  );
}

/**
 * Envelope em aquarela que se abre (vídeo) e de onde sobe a foto do casal (`animacoes.ts`).
 * Camadas: vídeo ao fundo, cartão com a foto no meio, bolso da frente por cima.
 * Sem animação, o envelope já está aberto com a foto para fora.
 */
function EnvelopeCapa({ fotoUrl, legenda }: { fotoUrl: string | null; legenda: string }) {
  return (
    <div data-envelope className="relative mx-auto aspect-[720/778] w-full max-w-md overflow-hidden">
      <video
        data-envelope-video
        data-fechado={aquarela('envelope-fechado.webp')}
        poster={aquarela('envelope-aberto.webp')}
        src={aquarela('envelope-abrindo.mp4')}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full mix-blend-multiply"
      />
      {fotoUrl && (
        <figure data-envelope-cartao className="absolute top-[5%] left-1/2 z-10 w-[60%] -translate-x-1/2 rounded-t-full bg-papel p-2.5 shadow-suave">
          <img src={fotoUrl} alt={legenda} loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-t-full object-cover" />
        </figure>
      )}
      <img data-envelope-bolso src={aquarela('envelope-bolso.webp')} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
    </div>
  );
}

export const Contagem = memo(function Contagem({ dataCasamento, horario }: { dataCasamento: string; horario?: string }) {
  const alvo = instanteCerimonia(dataCasamento, horario);
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    // Só a contagem re-renderiza a cada segundo; com a aba escondida, para.
    let id: ReturnType<typeof setInterval> | undefined;
    const ligar = () => {
      clearInterval(id);
      if (document.visibilityState === 'visible') {
        setAgora(new Date());
        id = setInterval(() => setAgora(new Date()), 1000);
      }
    };
    ligar();
    document.addEventListener('visibilitychange', ligar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', ligar);
    };
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
    <div role="timer" aria-label="Contagem regressiva" className="mt-4 flex divide-x divide-folha-escuro">
      {partes.map(([n, rotulo]) => (
        <div key={rotulo} className="min-w-16 px-4 sm:px-5">
          <span className="block font-caslon text-2xl leading-none text-verde">{n}</span>
          <span className="mt-1.5 block text-xs font-medium tracking-[0.14em] text-verde uppercase">{rotulo}</span>
        </div>
      ))}
    </div>
  );
});

function DetalhesLocal({ l }: { l: LocalConvite }) {
  const links = linksMapa(l);
  return (
    <div className="mt-6">
      {l.endereco && <p className="text-lg text-verde-suave">{l.endereco}</p>}
      {l.latitude !== null && l.longitude !== null && <MapaLocal latitude={l.latitude} longitude={l.longitude} nome={l.nome} />}
      {links && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
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

function Galeria({ fotos, numero }: { fotos: { id: number; fotoUrl: string; legenda: string }[]; numero?: string }) {
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
    <Secao id="galeria" titulo="Galeria" numero={numero} vinheta="v-galeria" largo>
      <div className="relative -mx-gutter overflow-hidden">
        <ul
          ref={varal}
          data-varal
          aria-label="Fotos do casal"
          className="relative flex snap-x snap-mandatory items-end gap-6 overflow-x-auto scroll-smooth px-gutter pt-6 pb-10 [scrollbar-width:none] sm:gap-10"
        >
          {fotos.map((f, i) => (
            <li key={f.id} className={`shrink-0 snap-center ${i % 2 ? 'mb-10' : ''}`}>
              <button
                type="button"
                data-moldura
                onClick={() => setAberta(f.id)}
                className={`block w-56 border border-ocre/60 p-2 text-left sm:w-64 ${MOLDURAS[i % MOLDURAS.length]}`}
              >
                <img
                  src={f.fotoUrl}
                  alt={f.legenda || 'Foto do casal'}
                  loading="lazy"
                  decoding="async"
                  className={`aspect-[4/5] w-full object-cover ${MOLDURAS[i % MOLDURAS.length]}`}
                />
              </button>
              {f.legenda && <p className="mt-3 text-center font-caslon text-verde-suave italic">{f.legenda}</p>}
            </li>
          ))}
        </ul>
      </div>
      <div data-setas className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={() => rolar(-1)} aria-label="Fotos anteriores" className="botao-contorno min-h-11 px-5">
          ←
        </button>
        <button type="button" onClick={() => rolar(1)} aria-label="Próximas fotos" className="botao-contorno min-h-11 px-5">
          →
        </button>
      </div>
      {atual && (
        <div role="dialog" aria-modal="true" data-lenis-prevent aria-label={atual.legenda || 'Foto'} className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/90 p-4 sm:p-10" onClick={() => setAberta(null)}>
          <figure className="max-h-full max-w-4xl bg-papel p-3">
            <img src={atual.fotoUrl} alt={atual.legenda || 'Foto do casal'} className="max-h-[78svh] object-contain" />
            {atual.legenda && <figcaption className="px-1 pt-3 pb-1 font-caslon text-verde italic">{atual.legenda}</figcaption>}
          </figure>
        </div>
      )}
    </Secao>
  );
}

/** Mapa no fim da página: Google Maps do local escolhido e atalhos de rota. */
function ComoChegar({ locais: todos, numero }: { locais: LocalMapa[]; numero?: string }) {
  const locais = todos.filter((l) => l.endereco.trim() !== '');
  const pendentes = todos.filter((l) => l.endereco.trim() === '');
  const [ativo, setAtivo] = useState(0);
  const local = locais[ativo] ?? locais[0];
  if (!local) return null;
  const q = encodeURIComponent(local.endereco);
  return (
    <Secao id="como-chegar" titulo="Como chegar" numero={numero} vinheta="v-chegar" largo>
      {locais.length > 1 && (
        <div role="tablist" aria-label="Locais" className="mb-8 flex gap-3">
          {locais.map((l, i) => (
            <button
              key={l.tipo}
              type="button"
              role="tab"
              aria-selected={i === ativo}
              onClick={() => setAtivo(i)}
              className={i === ativo ? 'botao' : 'botao-contorno'}
            >
              {LABEL_LOCAL[l.tipo]}
            </button>
          ))}
        </div>
      )}
      <div className="grid items-start gap-10 md:grid-cols-12 md:gap-16">
        <div data-reveal className="relative md:col-span-8">
          <span data-alfinete aria-hidden="true" className="absolute -top-5 left-1/2 z-10 -translate-x-1/2">
            <svg width="28" height="38" viewBox="0 0 28 38" className="drop-shadow">
              <path d="M14 0C6.3 0 0 6.1 0 13.7 0 24 14 38 14 38s14-14 14-24.3C28 6.1 21.7 0 14 0Z" fill="var(--color-verde)" />
              <circle cx="14" cy="13.5" r="5" fill="var(--color-vela)" />
            </svg>
          </span>
          <div className="cartao-mesa p-3">
            <iframe
              key={local.tipo}
              title={`Mapa: ${LABEL_LOCAL[local.tipo]}`}
              src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[4/3] w-full border-0 md:aspect-[16/10]"
            />
          </div>
        </div>
        <div data-reveal className="md:col-span-4">
          <p className="versalete text-musgo">{LABEL_LOCAL[local.tipo]}</p>
          <p className="mt-3 font-caslon text-2xl leading-snug text-verde">{local.endereco}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noreferrer" className="botao">
              Google Maps
            </a>
            <a href={`https://waze.com/ul?q=${q}&navigate=yes`} target="_blank" rel="noreferrer" className="botao-contorno">
              Waze
            </a>
          </div>
          {pendentes.map((l) => (
            <p key={l.tipo} className="mt-10 border-t border-folha pt-6 text-verde-suave">
              {LABEL_LOCAL[l.tipo]}: local a confirmar.
            </p>
          ))}
        </div>
      </div>
    </Secao>
  );
}

