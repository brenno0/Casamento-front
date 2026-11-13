import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../../lib/api';
import { linkConvite } from '../../lib/whatsapp';
import { BotoesWhatsApp } from './BotoesWhatsApp';
import { inputClass } from '../fornecedores/FornecedoresPage';
import {
  LABEL_FUNCAO,
  LABEL_LADO,
  LABEL_RSVP,
  LABEL_TIPO,
  useAtualizarConvidado,
  useAtualizarGrupo,
  useCriarConvidado,
  useCriarGrupo,
  useExcluirConvidado,
  useExcluirGrupo,
  useGrupos,
  useResumo,
  type Convidado,
  type Funcao,
  type Grupo,
  type Lado,
  type Rsvp,
  type Tipo,
  passaFiltros,
  type Filtros,
} from './useConvidados';

const SEM_FILTRO: Filtros = { lado: '', tipo: '', funcao: '', rsvp: '' };

type Modal =
  | { tipo: 'grupo'; grupo?: Grupo }
  | { tipo: 'convidado'; grupoId?: number; convidado?: Convidado };

/** Ações extras por grupo (link do convite, WhatsApp) entram por aqui nas próximas histórias. */
export type AcoesGrupo = (g: Grupo) => ReactNode;

export function ConvidadosPage({ acoesGrupo }: { acoesGrupo?: AcoesGrupo } = {}) {
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTRO);
  const [modal, setModal] = useState<Modal | null>(null);
  const [naoConfirmados, setNaoConfirmados] = useState(false);
  const grupos = useGrupos(busca, naoConfirmados);
  const algumFiltro = Object.values(filtros).some(Boolean);
  const visiveis = (grupos.data ?? [])
    .map((g) => ({ g, convidados: g.convidados.filter((c) => passaFiltros(c, filtros)) }))
    .filter(({ convidados }) => !algumFiltro || convidados.length > 0);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Convidados</h1>
          <p className="mt-2 text-grafite-suave">Cada grupo recebe um convite.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setModal({ tipo: 'grupo' })} className="rounded-pill border border-rosa-antigo-escuro px-5 py-2 text-rosa-antigo-escuro">
            Novo grupo
          </button>
          <button type="button" onClick={() => setModal({ tipo: 'convidado' })} className="rounded-pill bg-rosa-antigo-escuro px-5 py-2 text-marfim">
            Novo convidado
          </button>
        </div>
      </div>

      <ResumoCartoes />

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        <label className="block sm:col-span-5 lg:col-span-1">
          <span className="text-sm text-grafite-suave">Buscar</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome do grupo ou convidado" className={inputClass} />
        </label>
        <Filtro label="Lado" valor={filtros.lado} opcoes={LABEL_LADO} onChange={(v) => setFiltros({ ...filtros, lado: v as Lado | '' })} />
        <Filtro label="Tipo" valor={filtros.tipo} opcoes={LABEL_TIPO} onChange={(v) => setFiltros({ ...filtros, tipo: v as Tipo | '' })} />
        <Filtro label="Função" valor={filtros.funcao} opcoes={LABEL_FUNCAO} onChange={(v) => setFiltros({ ...filtros, funcao: v as Funcao | '' })} />
        <Filtro label="RSVP" valor={filtros.rsvp} opcoes={LABEL_RSVP} onChange={(v) => setFiltros({ ...filtros, rsvp: v as Rsvp | '' })} />
      </div>
      <label className="mt-3 flex items-center gap-2">
        <input type="checkbox" checked={naoConfirmados} onChange={(e) => setNaoConfirmados(e.target.checked)} />
        <span>Só grupos com alguém sem resposta (para lembrar)</span>
      </label>

      {grupos.isPending && (
        <p role="status" className="mt-6 text-grafite-suave">
          Carregando…
        </p>
      )}
      {grupos.isError && !grupos.data && (
        <p role="alert" className="mt-6 text-rosa-antigo-escuro">
          Não foi possível carregar os convidados.
        </p>
      )}
      {grupos.data && visiveis.length === 0 && <p className="mt-6 text-grafite-suave">Nenhum grupo encontrado.</p>}

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {visiveis.map(({ g, convidados }) => (
          <li key={g.id}>
            <CartaoGrupo
              g={g}
              convidados={convidados}
              onEditar={() => setModal({ tipo: 'grupo', grupo: g })}
              onNovoConvidado={() => setModal({ tipo: 'convidado', grupoId: g.id })}
              onEditarConvidado={(c) => setModal({ tipo: 'convidado', convidado: c })}
              acoes={
                <>
                  <BotoesWhatsApp g={g} lembrete={naoConfirmados} />
                  {acoesGrupo?.(g)}
                </>
              }
            />
          </li>
        ))}
      </ul>

      {modal?.tipo === 'grupo' && <GrupoModal grupo={modal.grupo} onClose={() => setModal(null)} />}
      {modal?.tipo === 'convidado' && (
        <ConvidadoModal
          convidado={modal.convidado}
          grupoId={modal.grupoId}
          grupos={grupos.data ?? []}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

function Filtro<T extends string>({
  label,
  valor,
  opcoes,
  onChange,
}: {
  label: string;
  valor: T | '';
  opcoes: Record<T, string>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-grafite-suave">{label}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Todos</option>
        {(Object.entries(opcoes) as [T, string][]).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResumoCartoes() {
  const { data } = useResumo();
  if (!data) return null;
  const itens: [string, number][] = [
    ['Pessoas', data.pessoas],
    ['Grupos', data.grupos],
    ['Adultos', data.adultos],
    ['Crianças', data.criancas],
    ['Confirmados', data.porRsvp.vai],
    ['Sem resposta', data.porRsvp.sem_resposta],
    ['Padrinhos', data.porFuncao.padrinho],
    ['Madrinhas', data.porFuncao.madrinha],
  ];
  return (
    <dl aria-label="Resumo" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {itens.map(([rotulo, n]) => (
        <div key={rotulo} className="rounded-card border border-dourado-claro bg-white p-3 text-center">
          <dt className="text-sm text-grafite-suave">{rotulo}</dt>
          <dd className="text-2xl">{n}</dd>
        </div>
      ))}
    </dl>
  );
}

const COR_RSVP: Record<Rsvp, string> = {
  sem_resposta: 'bg-marfim-escuro text-grafite-suave',
  vai: 'bg-salvia-claro text-grafite',
  nao_vai: 'bg-rosa-antigo-claro text-rosa-antigo-escuro',
};

function CartaoGrupo({
  g,
  convidados,
  onEditar,
  onNovoConvidado,
  onEditarConvidado,
  acoes,
}: {
  g: Grupo;
  convidados: Convidado[];
  onEditar: () => void;
  onNovoConvidado: () => void;
  onEditarConvidado: (c: Convidado) => void;
  acoes?: ReactNode;
}) {
  return (
    <article aria-label={`Grupo ${g.nome}`} className="rounded-card border border-dourado-claro bg-white p-4 shadow-suave">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl">{g.nome}</h2>
        <button type="button" onClick={onEditar} className="text-sm text-grafite-suave underline">
          Editar grupo
        </button>
      </div>
      {convidados.length === 0 ? (
        <p className="mt-2 text-sm text-grafite-suave">Nenhum convidado neste grupo.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {convidados.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onEditarConvidado(c)} className="text-left hover:text-rosa-antigo-escuro">
                {c.nome}
              </button>
              {c.tipo === 'crianca' && <span className="rounded-pill bg-marfim-escuro px-2 text-xs">Criança</span>}
              {c.funcao && <span className="rounded-pill bg-dourado-claro px-2 text-xs">{LABEL_FUNCAO[c.funcao]}</span>}
              <span className="text-xs text-grafite-suave">{LABEL_LADO[c.lado]}</span>
              <span
                className={`rounded-pill px-2 text-xs ${COR_RSVP[c.rsvp]}`}
                title={c.rsvpEm ? `Respondeu em ${new Date(c.rsvpEm).toLocaleString('pt-BR')}` : undefined}
              >
                {LABEL_RSVP[c.rsvp]}
                {c.rsvpEm && ` · ${new Date(c.rsvpEm).toLocaleDateString('pt-BR')}`}
              </span>
              {c.acompanhantePermitido && (
                <span className="text-xs text-grafite-suave">+1{c.acompanhanteNome ? `: ${c.acompanhanteNome}` : ''}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onNovoConvidado} className="text-sm text-rosa-antigo-escuro underline">
          + Convidado neste grupo
        </button>
        <CopiarLink token={g.token} nome={g.nome} />
        {acoes}
      </div>
    </article>
  );
}

function CopiarLink({ token, nome }: { token: string; nome: string }) {
  const [copiado, setCopiado] = useState<'ok' | 'erro' | null>(null);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkConvite(token));
      setCopiado('ok');
    } catch {
      setCopiado('erro');
    }
  }
  return (
    <span className="text-sm">
      <button type="button" aria-label={`Copiar link do convite de ${nome}`} onClick={() => void copiar()} className="text-grafite-suave underline">
        Copiar link
      </button>
      {copiado === 'ok' && <span role="status" className="ml-1 text-salvia-escuro">copiado!</span>}
      {copiado === 'erro' && (
        <span role="status" className="ml-1 break-all text-grafite-suave">
          {linkConvite(token)}
        </span>
      )}
    </span>
  );
}

function Dialogo({ titulo, onClose, ocupado, children }: { titulo: string; onClose: () => void; ocupado: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-grafite/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !ocupado) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={id} className="max-h-full w-full max-w-lg overflow-y-auto rounded-card bg-marfim p-6 shadow-suave">
        <h2 id={id} className="text-2xl">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}

function GrupoModal({ grupo, onClose }: { grupo?: Grupo; onClose: () => void }) {
  const criar = useCriarGrupo();
  const atualizar = useAtualizarGrupo();
  const excluir = useExcluirGrupo();
  const salvar = grupo ? atualizar : criar;
  const [nome, setNome] = useState(grupo?.nome ?? '');
  const [mensagem, setMensagem] = useState(grupo?.mensagem ?? '');
  const [contato, setContato] = useState<number | null>(grupo?.contatoConvidadoId ?? null);
  const comTelefone = (grupo?.convidados ?? []).filter((c) => c.telefone);
  const [confirmando, setConfirmando] = useState(false);
  const ocupado = salvar.isPending || excluir.isPending;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;
    const dados = { nome: nome.trim(), mensagem: mensagem.trim() || null };
    if (grupo) atualizar.mutate({ id: grupo.id, ...dados, contatoConvidadoId: contato }, { onSuccess: onClose });
    else criar.mutate(dados, { onSuccess: onClose });
  }

  return (
    <Dialogo titulo={grupo ? 'Editar grupo' : 'Novo grupo'} onClose={onClose} ocupado={ocupado}>
      <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
        <label className="block">
          <span className="text-sm text-grafite-suave">Nome do grupo</span>
          <input autoFocus maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Mensagem personalizada</span>
          <textarea rows={3} maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className={inputClass} />
        </label>
        {grupo && (
          <label className="block">
            <span className="text-sm text-grafite-suave">Contato no WhatsApp</span>
            <select
              value={contato ?? ''}
              onChange={(e) => setContato(e.target.value === '' ? null : Number(e.target.value))}
              className={inputClass}
            >
              <option value="">Escolher no WhatsApp na hora</option>
              {comTelefone.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {comTelefone.length === 0 && (
              <span className="text-xs text-grafite-suave">Cadastre o telefone de alguém do grupo para escolher.</span>
            )}
          </label>
        )}
        {salvar.isError && (
          <p role="alert" className="text-rosa-antigo-escuro">
            Não foi possível salvar o grupo.
          </p>
        )}
        {excluir.isError && (
          <p role="alert" className="text-rosa-antigo-escuro">
            {excluir.error instanceof ApiError && excluir.error.code === 'GRUPO_NAO_VAZIO'
              ? 'Mova ou exclua os convidados antes de excluir o grupo.'
              : 'Não foi possível excluir o grupo.'}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          {grupo ? (
            confirmando ? (
              <button type="button" disabled={ocupado} onClick={() => excluir.mutate(grupo.id, { onSuccess: onClose })} className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim">
                Confirmar exclusão
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmando(true)} className="text-rosa-antigo-escuro underline">
                Excluir grupo
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-grafite-suave">
              Cancelar
            </button>
            <button type="submit" disabled={!nome.trim() || ocupado} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
              Salvar
            </button>
          </div>
        </div>
      </form>
    </Dialogo>
  );
}

function ConvidadoModal({
  convidado,
  grupoId,
  grupos,
  onClose,
}: {
  convidado?: Convidado;
  grupoId?: number;
  grupos: Grupo[];
  onClose: () => void;
}) {
  const criar = useCriarConvidado();
  const atualizar = useAtualizarConvidado();
  const excluir = useExcluirConvidado();
  const salvar = convidado ? atualizar : criar;
  const [d, setD] = useState({
    nome: convidado?.nome ?? '',
    grupoId: convidado?.grupoId ?? grupoId ?? 0,
    tipo: convidado?.tipo ?? ('adulto' as Tipo),
    lado: convidado?.lado ?? ('ambos' as Lado),
    funcao: convidado?.funcao ?? ('' as Funcao | ''),
    telefone: convidado?.telefone ?? '',
    email: convidado?.email ?? '',
    acompanhantePermitido: convidado?.acompanhantePermitido ?? false,
    acompanhanteNome: convidado?.acompanhanteNome ?? '',
  });
  const [confirmando, setConfirmando] = useState(false);
  const ocupado = salvar.isPending || excluir.isPending;
  const campo = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => {
    salvar.reset();
    setD((x) => ({ ...x, [k]: v }));
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!d.nome.trim()) return;
    const dados = {
      nome: d.nome.trim(),
      // 0 = "novo grupo só com esta pessoa" (o servidor cria).
      ...(d.grupoId ? { grupoId: d.grupoId } : {}),
      tipo: d.tipo,
      lado: d.lado,
      funcao: d.funcao || null,
      telefone: d.telefone.trim() || null,
      email: d.email.trim() || null,
      acompanhantePermitido: d.acompanhantePermitido,
      acompanhanteNome: d.acompanhantePermitido ? d.acompanhanteNome.trim() || null : null,
    };
    if (convidado) atualizar.mutate({ id: convidado.id, ...dados }, { onSuccess: onClose });
    else criar.mutate(dados, { onSuccess: onClose });
  }

  return (
    <Dialogo titulo={convidado ? 'Editar convidado' : 'Novo convidado'} onClose={onClose} ocupado={ocupado}>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
        <label className="block sm:col-span-2">
          <span className="text-sm text-grafite-suave">Nome</span>
          <input autoFocus maxLength={80} value={d.nome} onChange={(e) => campo('nome', e.target.value)} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-grafite-suave">Grupo</span>
          <select value={d.grupoId} onChange={(e) => campo('grupoId', Number(e.target.value))} className={inputClass}>
            {!convidado && <option value={0}>Novo grupo só com esta pessoa</option>}
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Tipo</span>
          <select value={d.tipo} onChange={(e) => campo('tipo', e.target.value as Tipo)} className={inputClass}>
            {Object.entries(LABEL_TIPO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Lado</span>
          <select value={d.lado} onChange={(e) => campo('lado', e.target.value as Lado)} className={inputClass}>
            {Object.entries(LABEL_LADO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Função</span>
          <select value={d.funcao} onChange={(e) => campo('funcao', e.target.value as Funcao | '')} className={inputClass}>
            <option value="">Nenhuma</option>
            {Object.entries(LABEL_FUNCAO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Telefone (WhatsApp)</span>
          <input type="tel" value={d.telefone} onChange={(e) => campo('telefone', e.target.value)} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-grafite-suave">E-mail</span>
          <input type="email" value={d.email} onChange={(e) => campo('email', e.target.value)} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={d.acompanhantePermitido} onChange={(e) => campo('acompanhantePermitido', e.target.checked)} />
          <span>Liberar acompanhante (+1)</span>
        </label>
        {d.acompanhantePermitido && (
          <label className="block sm:col-span-2">
            <span className="text-sm text-grafite-suave">Nome do acompanhante (o convidado pode preencher)</span>
            <input maxLength={80} value={d.acompanhanteNome} onChange={(e) => campo('acompanhanteNome', e.target.value)} className={inputClass} />
          </label>
        )}
        {salvar.isError && (
          <p role="alert" className="text-rosa-antigo-escuro sm:col-span-2">
            {salvar.error instanceof ApiError && salvar.error.status === 400
              ? 'Confira os campos (telefone com DDD, e-mail válido).'
              : 'Não foi possível salvar o convidado.'}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
          {convidado ? (
            confirmando ? (
              <button type="button" disabled={ocupado} onClick={() => excluir.mutate(convidado.id, { onSuccess: onClose })} className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim">
                Confirmar exclusão
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmando(true)} className="text-rosa-antigo-escuro underline">
                Excluir convidado
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-grafite-suave">
              Cancelar
            </button>
            <button type="submit" disabled={!d.nome.trim() || ocupado} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
              Salvar
            </button>
          </div>
        </div>
      </form>
    </Dialogo>
  );
}
