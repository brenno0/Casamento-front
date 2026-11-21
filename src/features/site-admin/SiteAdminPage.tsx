import { useState, type FormEvent, type ReactNode } from 'react';
import { FileUpload } from '../../components/FileUpload';
import { formatDataCurta } from '../../lib/date';
import { montarTexto } from '../../lib/whatsapp';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { LABEL_LOCAL } from '../site/useSite';
import {
  moverNaLista,
  useAtualizarConfig,
  useAtualizarItem,
  useAtualizarLocal,
  useCriarItem,
  useExcluirItem,
  useOrdenar,
  useSitePainel,
  type SitePainel,
} from './useSiteAdmin';
import { IconePainel } from '../painel/IconePainel';
import { Esqueleto } from '../painel/Esqueleto';

type Aba = 'locais' | 'capa' | 'historia' | 'dress' | 'presentes' | 'galeria' | 'faq' | 'mensagens' | 'extras';

const ABAS: [Aba, string][] = [
  ['locais', 'Locais'],
  ['capa', 'Capa'],
  ['historia', 'Nossa história'],
  ['dress', 'Dress code e RSVP'],
  ['presentes', 'Lista de presentes'],
  ['galeria', 'Galeria'],
  ['faq', 'FAQ'],
  ['mensagens', 'Mensagens WhatsApp'],
];

/** Abas extras (RSVP, mensagens) entram pelas próximas histórias. */
export function SiteAdminPage({ extras }: { extras?: { label: string; conteudo: (s: SitePainel) => ReactNode } } = {}) {
  const [aba, setAba] = useState<Aba>('locais');
  const { data, isPending, isError } = useSitePainel();
  const abas = extras ? [...ABAS, ['extras', extras.label] as [Aba, string]] : ABAS;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Site</h1>
          <p className="mt-2 text-grafite-suave">O endereço da festa só aparece pelo link do convite.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="acao-secundaria">
          Ver site
          <IconePainel nome="abrir" className="size-3.5" />
        </a>
      </div>
      <div role="tablist" aria-label="Partes do site" className="abas mt-6">
        {abas.map(([v, l]) => (
          <button
            key={v}
            role="tab"
            type="button"
            aria-selected={aba === v}
            onClick={() => setAba(v)}
            className="aba"
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {isPending && <Esqueleto />}
        {isError && !data && (
          <p role="alert" className="text-erro">
            Não foi possível carregar o site.
          </p>
        )}
        {data && aba === 'locais' && <Locais s={data} />}
        {data && aba === 'capa' && <Capa s={data} />}
        {data && aba === 'historia' && <Historia s={data} />}
        {data && aba === 'dress' && <DressCode key={JSON.stringify(data.config)} s={data} />}
        {data && aba === 'presentes' && <ListasPresentes key={JSON.stringify(data.config.listasPresentes)} s={data} />}
        {data && aba === 'galeria' && <Galeria s={data} />}
        {data && aba === 'faq' && <Faq s={data} />}
        {data && aba === 'mensagens' && <Mensagens key={data.config.mensagemConvite + data.config.mensagemLembrete} s={data} />}
        {data && aba === 'extras' && extras?.conteudo(data)}
      </div>
    </section>
  );
}

function Erro({ mostrar, texto = 'Não foi possível salvar. Confira os campos.' }: { mostrar: boolean; texto?: string }) {
  return mostrar ? (
    <p role="alert" className="text-sm text-erro">
      {texto}
    </p>
  ) : null;
}

function Locais({ s }: { s: SitePainel }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {s.locais.map((l) => (
        <LocalForm key={JSON.stringify(l)} l={l} />
      ))}
    </div>
  );
}

function LocalForm({ l }: { l: SitePainel['locais'][number] }) {
  const salvar = useAtualizarLocal();
  const [d, setD] = useState({
    nome: l.nome,
    data: l.data,
    horario: l.horario,
    endereco: l.endereco,
    latitude: l.latitude?.toString() ?? '',
    longitude: l.longitude?.toString() ?? '',
  });
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
  const lat = num(d.latitude);
  const lng = num(d.longitude);
  const coordsOk = (lat === null || (Number.isFinite(lat) && Math.abs(lat) <= 90)) && (lng === null || (Number.isFinite(lng) && Math.abs(lng) <= 180));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!coordsOk) return;
    salvar.mutate({ tipo: l.tipo, nome: d.nome.trim(), data: d.data, horario: d.horario, endereco: d.endereco.trim(), latitude: lat, longitude: lng });
  }
  const campo = (k: keyof typeof d) => (e: { target: { value: string } }) => {
    salvar.reset();
    setD({ ...d, [k]: e.target.value });
  };

  return (
    <form onSubmit={onSubmit} aria-label={`Local ${LABEL_LOCAL[l.tipo]}`} className="grid gap-3 cartao-painel sm:grid-cols-2">
      <h2 className="text-2xl sm:col-span-2">{LABEL_LOCAL[l.tipo]}</h2>
      <label className="block sm:col-span-2">
        <span className="rotulo">Nome do lugar</span>
        <input value={d.nome} onChange={campo('nome')} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Data</span>
        <input type="date" value={d.data} onChange={campo('data')} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Horário</span>
        <input type="time" value={d.horario} onChange={campo('horario')} className={inputClass} />
      </label>
      <label className="block sm:col-span-2">
        <span className="rotulo">{l.tipo === 'festa' ? 'Endereço (só no convite)' : 'Endereço'}</span>
        <input value={d.endereco} onChange={campo('endereco')} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Latitude</span>
        <input inputMode="decimal" value={d.latitude} onChange={campo('latitude')} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Longitude</span>
        <input inputMode="decimal" value={d.longitude} onChange={campo('longitude')} className={inputClass} />
      </label>
      <p className="text-xs text-grafite-suave sm:col-span-2">
        Dica: no Google Maps, clique com o botão direito no local e copie as coordenadas.
      </p>
      {!coordsOk && <Erro mostrar texto="Coordenadas inválidas." />}
      <Erro mostrar={salvar.isError} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={!coordsOk || !d.nome.trim() || salvar.isPending} className="acao">
          Salvar
        </button>
        {salvar.isSuccess && <span role="status">Salvo.</span>}
      </div>
    </form>
  );
}

function BotoesOrdem({ ids, i, recurso }: { ids: number[]; i: number; recurso: 'historia' | 'galeria' | 'faq' }) {
  const ordenar = useOrdenar(recurso);
  return (
    <span className="flex gap-1">
      <button type="button" aria-label="Subir" disabled={i === 0 || ordenar.isPending} onClick={() => ordenar.mutate(moverNaLista(ids, i, -1))} className="px-2 disabled:opacity-30">
        ↑
      </button>
      <button type="button" aria-label="Descer" disabled={i === ids.length - 1 || ordenar.isPending} onClick={() => ordenar.mutate(moverNaLista(ids, i, 1))} className="px-2 disabled:opacity-30">
        ↓
      </button>
    </span>
  );
}

function Historia({ s }: { s: SitePainel }) {
  const criar = useCriarItem('historia');
  const [d, setD] = useState({ data: '', titulo: '', texto: '' });
  const [foto, setFoto] = useState<number | null>(null);
  const ids = s.historia.map((h) => h.id);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!d.data || !d.titulo.trim()) return;
    criar.mutate(
      { data: d.data, titulo: d.titulo.trim(), texto: d.texto.trim(), fotoArquivoId: foto },
      {
        onSuccess: () => {
          setD({ data: '', titulo: '', texto: '' });
          setFoto(null);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {s.historia.map((h, i) => (
          <ItemHistoria key={JSON.stringify(h)} h={h} ids={ids} i={i} />
        ))}
      </ul>
      <form onSubmit={onSubmit} aria-label="Novo momento" className="grid gap-3 cartao-painel sm:grid-cols-3">
        <CampoData valor={d.data} onChange={(data) => setD({ ...d, data })} />
        <label className="block sm:col-span-2">
          <span className="rotulo">Título</span>
          <input maxLength={120} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-3">
          <span className="rotulo">Texto</span>
          <textarea rows={3} maxLength={2000} value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <FileUpload label="Foto (opcional)" accept="image/jpeg,image/png,image/webp" onEnviado={(a) => setFoto(a.id)} />
          {foto && <p className="text-sm text-rose-fundo">Foto pronta.</p>}
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={!d.data || !d.titulo.trim() || criar.isPending} className="acao w-full">
            Adicionar momento
          </button>
        </div>
        <Erro mostrar={criar.isError} />
      </form>
    </div>
  );
}

/** Data do capítulo: dia exato ou só mês e ano (quando ninguém lembra o dia). */
function CampoData({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const soMes = /^\d{4}-\d{2}$/.test(valor);
  return (
    <div>
      <label className="block">
        <span className="rotulo">Data</span>
        <input type={soMes ? 'month' : 'date'} value={valor} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </label>
      <label className="mt-1.5 inline-flex items-center gap-2 text-xs text-grafite-suave">
        <input type="checkbox" checked={soMes} onChange={(e) => onChange(e.target.checked ? valor.slice(0, 7) : valor ? `${valor}-01` : '')} />
        Só mês e ano
      </label>
    </div>
  );
}

const dataLegivel = (data: string) => {
  const mes = /^(\d{4})-(\d{2})$/.exec(data);
  return mes ? `${mes[2]}/${mes[1]}` : formatDataCurta(data);
};

function ItemHistoria({ h, ids, i }: { h: SitePainel['historia'][number]; ids: number[]; i: number }) {
  const atualizar = useAtualizarItem('historia');
  const excluir = useExcluirItem('historia');
  const [editando, setEditando] = useState(false);
  const [d, setD] = useState({ data: h.data, titulo: h.titulo, texto: h.texto });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!d.data || !d.titulo.trim()) return;
    atualizar.mutate({ id: h.id, data: d.data, titulo: d.titulo.trim(), texto: d.texto.trim() }, { onSuccess: () => setEditando(false) });
  }

  return (
    <li className="cartao-painel p-3">
      <div className="flex flex-wrap items-center gap-3">
        <BotoesOrdem ids={ids} i={i} recurso="historia" />
        {h.fotoUrl && <img src={h.fotoUrl} alt="" className="h-12 w-12 rounded object-cover" />}
        <span className="flex-1">
          {dataLegivel(h.data)} · <strong>{h.titulo}</strong>
        </span>
        <FileUpload label="Trocar foto" accept="image/jpeg,image/png,image/webp" onEnviado={(a) => atualizar.mutate({ id: h.id, fotoArquivoId: a.id })} />
        <button type="button" aria-expanded={editando} onClick={() => setEditando(!editando)} className="acao-secundaria min-h-8 px-3 text-sm">
          {editando ? 'Fechar' : 'Editar'}
        </button>
        <button type="button" aria-label={`Excluir ${h.titulo}`} onClick={() => excluir.mutate(h.id)} className="text-sm acao-perigo">
          Excluir
        </button>
      </div>
      {editando && (
        <form onSubmit={onSubmit} aria-label={`Editar ${h.titulo}`} className="mt-4 grid gap-3 sm:grid-cols-3">
          <CampoData valor={d.data} onChange={(data) => setD({ ...d, data })} />
          <label className="block sm:col-span-2">
            <span className="rotulo">Título</span>
            <input maxLength={120} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} className={inputClass} />
          </label>
          <label className="block sm:col-span-3">
            <span className="rotulo">Texto</span>
            <textarea rows={8} maxLength={2000} value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} className={inputClass} />
          </label>
          <Erro mostrar={atualizar.isError} />
          <div className="sm:col-span-3">
            <button type="submit" disabled={!d.data || !d.titulo.trim() || atualizar.isPending} className="acao">
              Salvar
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

function ItemFaq({ f, ids, i }: { f: SitePainel['faq'][number]; ids: number[]; i: number }) {
  const atualizar = useAtualizarItem('faq');
  const excluir = useExcluirItem('faq');
  const [editando, setEditando] = useState(false);
  const [pergunta, setPergunta] = useState(f.pergunta);
  const [resposta, setResposta] = useState(f.resposta);
  const valido = pergunta.trim() !== '' && resposta.trim() !== '';

  return (
    <li className="cartao-painel p-3">
      <div className="flex items-start gap-3">
        <BotoesOrdem ids={ids} i={i} recurso="faq" />
        <div className="flex-1">
          <p className="font-semibold">{f.pergunta}</p>
          {!editando && <p className="whitespace-pre-line text-grafite-suave">{f.resposta}</p>}
        </div>
        <button type="button" aria-expanded={editando} onClick={() => setEditando(!editando)} className="acao-secundaria min-h-8 px-3 text-sm">
          {editando ? 'Fechar' : 'Editar'}
        </button>
        <button type="button" aria-label={`Excluir pergunta ${f.pergunta}`} onClick={() => excluir.mutate(f.id)} className="text-sm acao-perigo">
          Excluir
        </button>
      </div>
      {editando && (
        <form
          aria-label={`Editar pergunta ${f.pergunta}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) atualizar.mutate({ id: f.id, pergunta: pergunta.trim(), resposta: resposta.trim() }, { onSuccess: () => setEditando(false) });
          }}
          className="mt-4 space-y-3"
        >
          <label className="block">
            <span className="rotulo">Pergunta</span>
            <input maxLength={300} value={pergunta} onChange={(e) => setPergunta(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="rotulo">Resposta</span>
            <textarea rows={3} maxLength={2000} value={resposta} onChange={(e) => setResposta(e.target.value)} className={inputClass} />
          </label>
          <Erro mostrar={atualizar.isError} />
          <button type="submit" disabled={!valido || atualizar.isPending} className="acao">
            Salvar
          </button>
        </form>
      )}
    </li>
  );
}

const MAX_LISTAS = 5;
const linhaVazia = { titulo: '', url: '' };

/** Listas de presentes hospedadas fora (iCasei e afins). O site mostra um botão para cada uma. */
function ListasPresentes({ s }: { s: SitePainel }) {
  const salvar = useAtualizarConfig();
  const [listas, setListas] = useState(s.config.listasPresentes.length ? s.config.listasPresentes : [linhaVazia]);
  const preenchidas = listas.map((l) => ({ titulo: l.titulo.trim(), url: l.url.trim() })).filter((l) => l.titulo || l.url);
  const valido = preenchidas.every((l) => l.titulo && /^https?:\/\/\S+$/.test(l.url));
  const mudar = (i: number, campo: 'titulo' | 'url', valor: string) => {
    salvar.reset();
    setListas(listas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));
  };

  return (
    <form
      aria-label="Listas de presentes"
      onSubmit={(e) => {
        e.preventDefault();
        if (valido) salvar.mutate({ listasPresentes: preenchidas });
      }}
      className="space-y-4 cartao-painel"
    >
      <p className="text-sm text-grafite-suave">Cada lista vira um botão na seção Lista de presentes do site. Sem nenhuma, a seção some.</p>
      {listas.map((l, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <label className="block">
            <span className="rotulo">Texto do botão</span>
            <input maxLength={60} placeholder="Lista no iCasei" value={l.titulo} onChange={(e) => mudar(i, 'titulo', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="rotulo">Link</span>
            <input type="url" placeholder="https://…" value={l.url} onChange={(e) => mudar(i, 'url', e.target.value)} className={inputClass} />
          </label>
          <button
            type="button"
            aria-label={`Remover lista ${i + 1}`}
            onClick={() => setListas(listas.length === 1 ? [linhaVazia] : listas.filter((_, j) => j !== i))}
            className="acao-discreta min-h-10 px-2"
          >
            <IconePainel nome="fechar" />
          </button>
        </div>
      ))}
      {listas.length < MAX_LISTAS && (
        <button type="button" onClick={() => setListas([...listas, linhaVazia])} className="acao-link text-sm">
          + Outra lista
        </button>
      )}
      {!valido && <Erro mostrar texto="Cada lista precisa de texto e de um link começando com https://." />}
      <Erro mostrar={salvar.isError} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!valido || salvar.isPending} className="acao">
          Salvar
        </button>
        {salvar.isSuccess && <span role="status">Salvo.</span>}
      </div>
    </form>
  );
}

/** Foto do cartão que sai do envelope na abertura do site. */
function Capa({ s }: { s: SitePainel }) {
  const salvar = useAtualizarConfig();
  return (
    <div className="flex flex-wrap items-start gap-6 cartao-painel">
      {s.config.capaUrl ? (
        <img src={s.config.capaUrl} alt="Capa atual" className="aspect-[4/5] w-40 rounded-t-full object-cover" />
      ) : (
        <p className="text-grafite-suave">Sem foto de capa. O envelope abre vazio.</p>
      )}
      <div className="space-y-3">
        <FileUpload label="Trocar foto de capa" accept="image/jpeg,image/png,image/webp" onEnviado={(a) => salvar.mutate({ fotoCapaArquivoId: a.id })} />
        <Erro mostrar={salvar.isError} />
        {salvar.isSuccess && <p role="status">Salvo.</p>}
      </div>
    </div>
  );
}

function DressCode({ s }: { s: SitePainel }) {
  const salvar = useAtualizarConfig();
  const [texto, setTexto] = useState(s.config.dressCode);
  const [paleta, setPaleta] = useState(s.config.paleta);
  const [prazo, setPrazo] = useState(s.config.rsvpPrazo);
  return (
    <form
      aria-label="Dress code"
      onSubmit={(e) => {
        e.preventDefault();
        salvar.mutate({ dressCode: texto.trim(), paleta, rsvpPrazo: prazo });
      }}
      className="space-y-4 cartao-painel"
    >
      <label className="block">
        <span className="rotulo">Texto do dress code</span>
        <textarea rows={3} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Prazo para confirmar presença (RSVP)</span>
        <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputClass} />
      </label>
      <fieldset>
        <legend className="rotulo">Paleta sugerida (até 6 cores)</legend>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {paleta.map((cor, i) => (
            <span key={i} className="flex items-center gap-1">
              <input
                type="color"
                aria-label={`Cor ${i + 1}`}
                value={cor}
                onChange={(e) => setPaleta(paleta.map((c, j) => (j === i ? e.target.value : c)))}
              />
              <button type="button" aria-label={`Remover cor ${i + 1}`} onClick={() => setPaleta(paleta.filter((_, j) => j !== i))} className="text-sm text-grafite-suave">
                ×
              </button>
            </span>
          ))}
          {paleta.length < 6 && (
            <button type="button" onClick={() => setPaleta([...paleta, '#c48b8b'])} className="acao-secundaria min-h-8 px-3 py-1 text-sm">
              + cor
            </button>
          )}
        </div>
      </fieldset>
      <Erro mostrar={salvar.isError} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={salvar.isPending || !prazo} className="acao">
          Salvar
        </button>
        {salvar.isSuccess && <span role="status">Salvo.</span>}
      </div>
    </form>
  );
}

function Galeria({ s }: { s: SitePainel }) {
  const criar = useCriarItem('galeria');
  const excluir = useExcluirItem('galeria');
  const atualizar = useAtualizarItem('galeria');
  const ids = s.galeria.map((g) => g.id);
  return (
    <div className="space-y-4">
      <FileUpload label="Adicionar foto à galeria" accept="image/jpeg,image/png,image/webp" onEnviado={(a) => criar.mutate({ arquivoId: a.id })} />
      <Erro mostrar={criar.isError} texto="Não foi possível adicionar a foto." />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {s.galeria.map((g, i) => (
          <li key={g.id} className="cartao-painel p-2">
            <img src={g.fotoUrl} alt={g.legenda} className="aspect-square w-full rounded object-cover" />
            <input
              aria-label="Legenda"
              defaultValue={g.legenda}
              maxLength={200}
              onBlur={(e) => e.target.value !== g.legenda && atualizar.mutate({ id: g.id, legenda: e.target.value })}
              className={inputClass}
            />
            <div className="mt-1 flex justify-between">
              <BotoesOrdem ids={ids} i={i} recurso="galeria" />
              <button type="button" onClick={() => excluir.mutate(g.id)} className="text-sm acao-perigo">
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ s }: { s: SitePainel }) {
  const criar = useCriarItem('faq');
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const ids = s.faq.map((f) => f.id);
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {s.faq.map((f, i) => (
          <ItemFaq key={JSON.stringify(f)} f={f} ids={ids} i={i} />
        ))}
      </ul>
      <form
        aria-label="Nova pergunta"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pergunta.trim() || !resposta.trim()) return;
          criar.mutate(
            { pergunta: pergunta.trim(), resposta: resposta.trim() },
            {
              onSuccess: () => {
                setPergunta('');
                setResposta('');
              },
            },
          );
        }}
        className="space-y-3 cartao-painel"
      >
        <label className="block">
          <span className="rotulo">Pergunta</span>
          <input maxLength={300} value={pergunta} onChange={(e) => setPergunta(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Resposta</span>
          <textarea rows={2} maxLength={2000} value={resposta} onChange={(e) => setResposta(e.target.value)} className={inputClass} />
        </label>
        <Erro mostrar={criar.isError} />
        <button type="submit" disabled={!pergunta.trim() || !resposta.trim() || criar.isPending} className="acao">
          Adicionar
        </button>
      </form>
    </div>
  );
}

function Mensagens({ s }: { s: SitePainel }) {
  const salvar = useAtualizarConfig();
  const [convite, setConvite] = useState(s.config.mensagemConvite);
  const [lembrete, setLembrete] = useState(s.config.mensagemLembrete);
  const exemplo = { grupo: 'Família Souza', link: `${window.location.origin}/c/exemplo`, prazo: s.config.rsvpPrazo };
  return (
    <form
      aria-label="Mensagens WhatsApp"
      onSubmit={(e) => {
        e.preventDefault();
        salvar.mutate({ mensagemConvite: convite.trim(), mensagemLembrete: lembrete.trim() });
      }}
      className="space-y-4 cartao-painel"
    >
      <p className="text-sm text-grafite-suave">
        Use {'{grupo}'}, {'{link}'} e {'{prazo}'}: eles são trocados pelo nome do grupo, o link do convite e o prazo do RSVP.
      </p>
      {(
        [
          ['Convite', convite, setConvite],
          ['Lembrete', lembrete, setLembrete],
        ] as const
      ).map(([rotulo, valor, set]) => (
        <div key={rotulo} className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="rotulo">Mensagem de {rotulo.toLowerCase()}</span>
            <textarea
              rows={5}
              maxLength={1000}
              value={valor}
              onChange={(e) => {
                salvar.reset();
                set(e.target.value);
              }}
              className={inputClass}
            />
          </label>
          <div>
            <span className="rotulo">Prévia</span>
            <p aria-label={`Prévia do ${rotulo.toLowerCase()}`} className="mt-1 rounded-card bg-rose-claro p-3 whitespace-pre-line">
              {montarTexto(valor, exemplo)}
            </p>
          </div>
        </div>
      ))}
      <Erro mostrar={salvar.isError} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!convite.trim() || !lembrete.trim() || salvar.isPending} className="acao">
          Salvar
        </button>
        {salvar.isSuccess && <span role="status">Salvo.</span>}
      </div>
    </form>
  );
}
