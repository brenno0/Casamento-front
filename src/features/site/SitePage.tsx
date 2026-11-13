import { useEffect, useState, type ReactNode } from 'react';
import { formatDataCurta, formatDataExtenso } from '../../lib/date';
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

export interface SlotsSite {
  rsvp?: ReactNode;
  presentes?: ReactNode;
  mural?: ReactNode;
}

type Props =
  | { camada: 'publico'; site: SitePublico; slots?: SlotsSite; aviso?: ReactNode }
  | { camada: 'convite'; site: SiteConvite; slots?: SlotsSite; aviso?: ReactNode };

const ehConvite = (l: LocalPublico | LocalConvite): l is LocalConvite => 'endereco' in l;

const momentos = [
  { src: '/images/casal/nayane-brenno-encontro.jpeg', alt: 'Nayane e Brenno em um momento descontraído juntos' },
  { src: '/images/casal/nayane-brenno-cerimonia.jpeg', alt: 'Nayane e Brenno em traje de casamento' },
  { src: '/images/casal/nayane-brenno-flores.jpeg', alt: 'Nayane e Brenno ao lado de flores' },
];

export function SitePage(props: Props) {
  const { site, camada, slots = {}, aviso } = props;
  const convite = camada === 'convite';
  const secoes: [string, string, boolean][] = [
    ['historia', 'Nossa história', site.historia.length > 0],
    ['momentos', 'Momentos', true],
    ['locais', 'Cerimônia e festa', true],
    ['dress-code', 'Dress code', true],
    ['rsvp', 'Confirmar presença', convite],
    ['presentes', 'Lista de presentes', true],
    ['galeria', 'Galeria', site.galeria.length > 0],
    ['mural', 'Mural de recados', convite],
    ['faq', 'Dúvidas', site.faq.length > 0],
  ];

  return (
    <main className="wedding-site">
      <nav aria-label="Seções" className="wedding-nav">
        <a href="#inicio" className="wedding-brand" aria-label={`${site.casal.nomeNoiva} e ${site.casal.nomeNoivo}, início`}>
          <span>{site.casal.nomeNoiva}</span><i aria-hidden="true">&</i><span>{site.casal.nomeNoivo}</span>
        </a>
        <ul>
          {secoes.filter(([, , mostrar]) => mostrar).map(([id, label]) => (
            <li key={id}><a href={`#${id}`}>{label}</a></li>
          ))}
        </ul>
      </nav>

      {aviso}

      <Hero site={site} saudacao={convite ? (props.site as SiteConvite).grupo : undefined} />

      {site.historia.length > 0 && (
        <Secao id="historia" titulo="Nossa história" subtitulo="De tantos encontros, nasceu o nosso para sempre.">
          <ol className="story-list">
            {site.historia.map((h) => (
              <li key={h.id} data-reveal>
                <time dateTime={h.data}>{formatDataCurta(h.data)}</time>
                <div>
                  <h3>{h.titulo}</h3>
                  {h.texto && <p>{h.texto}</p>}
                  {h.fotoUrl && <img src={h.fotoUrl} alt={h.titulo} loading="lazy" />}
                </div>
              </li>
            ))}
          </ol>
        </Secao>
      )}

      <section id="momentos" className="moments-section" aria-labelledby="momentos-titulo">
        <div className="moments-copy" data-reveal>
          <h2 id="momentos-titulo">O amor mora<br />nos detalhes.</h2>
          <p>Um pouquinho dos caminhos que trouxeram a gente até aqui.</p>
        </div>
        <ul className="moments-grid" aria-label="Fotos de Nayane e Brenno">
          {momentos.map((foto, i) => (
            <li key={foto.src} data-reveal className={`moment moment-${i + 1}`}>
              <img src={foto.src} alt={foto.alt} loading={i === 0 ? 'eager' : 'lazy'} />
            </li>
          ))}
        </ul>
      </section>

      <Secao id="locais" titulo="Cerimônia e festa" subtitulo="Vai ser ainda mais especial com você por perto.">
        <div className="venue-list">
          {site.locais.map((l, i) => (
            <article key={l.tipo} data-reveal aria-label={LABEL_LOCAL[l.tipo]} className="venue">
              <span className="venue-index">{String(i + 1).padStart(2, '0')}</span>
              <div className="venue-info">
                <p className="section-overline">{LABEL_LOCAL[l.tipo]}</p>
                <h3>{l.nome}</h3>
                <p><time dateTime={l.data}>{formatDataExtenso(l.data)}</time><span aria-hidden="true"> · </span>{l.horario.replace(':', 'h')}</p>
                {ehConvite(l) && <DetalhesLocal l={l} />}
              </div>
              {!convite && i === 0 && <p className="venue-note">Endereço e mapa estão no convite que você recebeu.</p>}
            </article>
          ))}
        </div>
      </Secao>

      <Secao id="dress-code" titulo="Dress code" subtitulo="Um pedido carinhoso para celebrar com conforto e elegância.">
        <div className="dress-code" data-reveal>
          <p>{site.dressCode.texto}</p>
          {site.dressCode.paleta.length > 0 && (
            <ul aria-label="Paleta sugerida">
              {site.dressCode.paleta.map((cor) => <li key={cor}><span aria-label={cor} title={cor} style={{ backgroundColor: cor }} /></li>)}
            </ul>
          )}
        </div>
      </Secao>

      {convite && (
        <Secao id="rsvp" titulo="Confirmar presença" subtitulo="Conte pra gente se vem comemorar este dia." tone="green">
          {slots.rsvp ?? <p className="section-fallback">A confirmação de presença abre em breve.</p>}
        </Secao>
      )}

      <Secao id="presentes" titulo="Lista de presentes" subtitulo="Sua presença é o melhor presente. Se quiser nos mimar, preparamos uma lista especial.">
        {slots.presentes ?? <p className="section-fallback">A lista de presentes chega em breve.</p>}
      </Secao>

      {site.galeria.length > 0 && <Galeria fotos={site.galeria} />}

      {convite && (
        <Secao id="mural" titulo="Mural de recados" subtitulo="Vamos guardar cada palavra com muito carinho." tone="green">
          {slots.mural ?? <p className="section-fallback">O mural de recados abre em breve.</p>}
        </Secao>
      )}

      {site.faq.length > 0 && (
        <Secao id="faq" titulo="Dúvidas" subtitulo="Um guia rápido para aproveitar esse dia com a gente.">
          <div className="faq-list">
            {site.faq.map((f) => <details key={f.id} data-reveal><summary>{f.pergunta}</summary><p>{f.resposta}</p></details>)}
          </div>
        </Secao>
      )}

      <footer className="wedding-footer">
        <p className="footer-names">{site.casal.nomeNoiva} <i aria-hidden="true">&</i> {site.casal.nomeNoivo}</p>
        <p><time dateTime={site.casal.dataCasamento}>{formatDataExtenso(site.casal.dataCasamento)}</time></p>
        <a href="#inicio">Voltar ao início ↑</a>
      </footer>
    </main>
  );
}

function Secao({ id, titulo, subtitulo, children, tone }: { id: string; titulo: string; subtitulo?: string; children: ReactNode; tone?: 'green' }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={`wedding-section${tone ? ` wedding-section-${tone}` : ''}`}>
      <header className="section-heading" data-reveal>
        <h2 id={`${id}-titulo`}>{titulo}</h2>
        {subtitulo && <p>{subtitulo}</p>}
      </header>
      {children}
    </section>
  );
}

function Hero({ site, saudacao }: { site: SitePublico | SiteConvite; saudacao?: { nome: string; mensagem: string | null } }) {
  return (
    <header id="inicio" className="wedding-hero">
      <div className="hero-copy">
        {saudacao && <p className="guest-greeting">Querida família {saudacao.nome},</p>}
        <h1><span>{site.casal.nomeNoiva}</span><i aria-hidden="true">&amp;</i><span>{site.casal.nomeNoivo}</span></h1>
        <p className="hero-invite-line">Com alegria, convidamos você.</p>
        <div className="hero-rule" aria-hidden="true"><span /></div>
        <p className="hero-date"><time dateTime={site.casal.dataCasamento}>{formatDataExtenso(site.casal.dataCasamento)}</time></p>
        {saudacao?.mensagem && <p className="hero-message">{saudacao.mensagem}</p>}
        <a className="hero-link" href="#locais">Conheça os detalhes <span aria-hidden="true">↓</span></a>
        <Contagem dataCasamento={site.casal.dataCasamento} horario={site.locais[0]?.horario} />
      </div>
      <figure className="hero-church-art">
        <img src="/images/casal/igreja-aquarela.jpeg" alt="Ilustração em aquarela da igreja da cerimônia" fetchPriority="high" />
      </figure>
      <p className="hero-side-note" aria-hidden="true">17 · 07 · 2027</p>
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
  if (t.chegou) return <p className="countdown-today">É hoje!</p>;
  const partes: [number, string][] = [[t.dias, 'dias'], [t.horas, 'horas'], [t.minutos, 'min'], [t.segundos, 'seg']];
  return (
    <div role="timer" aria-label="Contagem regressiva" className="countdown">
      {partes.map(([n, rotulo]) => <div key={rotulo}><span>{n}</span><small>{rotulo}</small></div>)}
    </div>
  );
}

function DetalhesLocal({ l }: { l: LocalConvite }) {
  const links = linksMapa(l);
  return (
    <div className="venue-details">
      {l.endereco && <p>{l.endereco}</p>}
      {l.latitude !== null && l.longitude !== null && <MapaLocal latitude={l.latitude} longitude={l.longitude} nome={l.nome} />}
      {links && <div className="map-links"><a href={links.google} target="_blank" rel="noreferrer">Abrir no Google Maps ↗</a><a href={links.waze} target="_blank" rel="noreferrer">Waze ↗</a></div>}
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
    <Secao id="galeria" titulo="Galeria" subtitulo="Cada instante, um pedacinho da nossa história.">
      <ul className="gallery-grid">
        {fotos.map((f) => <li key={f.id} data-reveal><button type="button" onClick={() => setAberta(f.id)} aria-label={`Ampliar foto: ${f.legenda || 'Foto do casal'}`}><img src={f.fotoUrl} alt={f.legenda || 'Foto do casal'} loading="lazy" /></button></li>)}
      </ul>
      {atual && (
        <div role="dialog" aria-modal="true" aria-label={atual.legenda || 'Foto'} className="gallery-lightbox" onClick={() => setAberta(null)}>
          <button type="button" aria-label="Fechar foto" onClick={() => setAberta(null)}>×</button>
          <figure onClick={(e) => e.stopPropagation()}><img src={atual.fotoUrl} alt={atual.legenda || 'Foto do casal'} /><figcaption>{atual.legenda}</figcaption></figure>
        </div>
      )}
    </Secao>
  );
}
