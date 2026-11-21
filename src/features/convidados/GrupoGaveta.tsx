import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../../lib/api';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { Avatar } from '../painel/Avatar';
import { BotaoFechar } from '../painel/BotaoFechar';
import { BotaoSegurar } from '../painel/BotaoSegurar';
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
  type Convidado,
  type DadosConvidado,
  type Funcao,
  type Grupo,
  type Lado,
  type Tipo,
} from './useConvidados';

const campoPequeno = `${inputClass} mt-0 min-h-8 py-1 text-sm`;

export function Dialogo({
  titulo,
  onClose,
  ocupado,
  largo = false,
  children,
}: {
  titulo: string;
  onClose: () => void;
  ocupado: boolean;
  largo?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className="dialogo-fundo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !ocupado) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={id} className={`dialogo ${largo ? 'dialogo-largo' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <h2 id={id} className="titulo-dialogo">
            {titulo}
          </h2>
          <BotaoFechar onClick={onClose} disabled={ocupado} />
        </div>
        {children}
      </div>
    </div>
  );
}

/** Nome, mensagem e contato do grupo. Sem `grupo`, cria um novo. */
export function FormGrupo({ grupo, onClose }: { grupo?: Grupo; onClose: () => void }) {
  const criar = useCriarGrupo();
  const atualizar = useAtualizarGrupo();
  const excluir = useExcluirGrupo();
  const salvar = grupo ? atualizar : criar;
  const [nome, setNome] = useState(grupo?.nome ?? '');
  const [mensagem, setMensagem] = useState(grupo?.mensagem ?? '');
  const [contato, setContato] = useState<number | null>(grupo?.contatoConvidadoId ?? null);
  const comTelefone = (grupo?.convidados ?? []).filter((c) => c.telefone);
  const ocupado = salvar.isPending || excluir.isPending;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;
    const dados = { nome: nome.trim(), mensagem: mensagem.trim() || null };
    if (grupo) atualizar.mutate({ id: grupo.id, ...dados, contatoConvidadoId: contato }, { onSuccess: onClose });
    else criar.mutate(dados, { onSuccess: onClose });
  }

  return (
    <form onSubmit={onSubmit} aria-label="Dados do grupo" className="mt-4 space-y-4" noValidate>
      <label className="block">
        <span className="rotulo">Nome do grupo</span>
        <input autoFocus={!grupo} maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Mensagem personalizada</span>
        <textarea rows={3} maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className={inputClass} />
      </label>
      {grupo && (
        <label className="block">
          <span className="rotulo">Contato no WhatsApp</span>
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
        <p role="alert" className="text-erro">
          Não foi possível salvar o grupo.
        </p>
      )}
      {excluir.isError && (
        <p role="alert" className="text-erro">
          {excluir.error instanceof ApiError && excluir.error.code === 'GRUPO_NAO_VAZIO'
            ? 'Mova ou exclua os convidados antes de excluir o grupo.'
            : 'Não foi possível excluir o grupo.'}
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        {grupo ? (
          <BotaoSegurar disabled={ocupado} onConfirmar={() => excluir.mutate(grupo.id, { onSuccess: onClose })}>
            Excluir grupo
          </BotaoSegurar>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="acao-discreta">
            {grupo ? 'Fechar' : 'Cancelar'}
          </button>
          <button type="submit" disabled={!nome.trim() || ocupado} className="acao">
            Salvar
          </button>
        </div>
      </div>
    </form>
  );
}

/** Gaveta do grupo: as pessoas editáveis em linha e, no fim, os dados do grupo. */
export function GrupoGaveta({ grupo, grupos, onClose }: { grupo: Grupo; grupos: Grupo[]; onClose: () => void }) {
  return (
    <Dialogo titulo={grupo.nome} onClose={onClose} ocupado={false} largo>
      <p className="mt-1 text-sm text-grafite-suave">
        {grupo.convidados.length === 1 ? '1 pessoa' : `${grupo.convidados.length} pessoas`}
      </p>
      <ul aria-label="Pessoas do grupo" className="mt-4 divide-y divide-linha rounded-card border border-linha">
        {grupo.convidados.map((c) => (
          <LinhaPessoa key={c.id} c={c} grupos={grupos} />
        ))}
        {grupo.convidados.length === 0 && <li className="px-4 py-3 text-sm text-grafite-suave">Ninguém neste grupo ainda.</li>}
      </ul>
      <AdicionarPessoa grupo={grupo} grupos={grupos} />
      <h3 className="mt-8 border-t border-linha pt-6">Dados do grupo</h3>
      <FormGrupo key={grupo.id} grupo={grupo} onClose={onClose} />
    </Dialogo>
  );
}

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
const MAX_SUGESTOES = 6;

/** Digita um nome: traz quem já está em outro grupo ou cadastra uma pessoa nova aqui. */
function AdicionarPessoa({ grupo, grupos }: { grupo: Grupo; grupos: Grupo[] }) {
  const criar = useCriarConvidado();
  const mover = useAtualizarConvidado();
  const [nome, setNome] = useState('');
  const lado: Lado = grupo.convidados[0]?.lado ?? 'ambos';
  const termo = semAcento(nome);
  const sugestoes = termo
    ? grupos
        .filter((g) => g.id !== grupo.id)
        .flatMap((g) => g.convidados.map((c) => ({ c, g })))
        .filter(({ c }) => semAcento(c.nome).includes(termo))
        .slice(0, MAX_SUGESTOES)
    : [];
  const limpar = { onSuccess: () => setNome('') };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;
    criar.mutate({ nome: nome.trim(), grupoId: grupo.id, lado }, limpar);
  }

  return (
    <form onSubmit={onSubmit} aria-label="Adicionar pessoa" className="mt-3">
      <div className="flex gap-2">
        <input
          aria-label="Nome da pessoa"
          placeholder="Nome de alguém novo ou já cadastrado"
          maxLength={80}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`${inputClass} mt-0`}
        />
        <button type="submit" disabled={!nome.trim() || criar.isPending} className="acao-secundaria shrink-0">
          Adicionar nova
        </button>
      </div>
      {sugestoes.length > 0 && (
        <ul aria-label="Já cadastrados" className="mt-2 divide-y divide-linha rounded-card border border-linha">
          {sugestoes.map(({ c, g }) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={mover.isPending}
                onClick={() => mover.mutate({ id: c.id, grupoId: grupo.id }, limpar)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-nevoa"
              >
                <Avatar nome={c.nome} className="size-6 text-[0.625rem]" />
                <span className="font-medium">Trazer {c.nome}</span>
                <span className="ml-auto text-xs text-grafite-suave">hoje em {g.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(criar.isError || mover.isError) && (
        <p role="alert" className="mt-2 text-sm text-erro">
          Não foi possível adicionar.
        </p>
      )}
    </form>
  );
}

/** Uma pessoa do grupo. Escolhas salvam na hora; textos salvam ao sair do campo. */
function LinhaPessoa({ c, grupos }: { c: Convidado; grupos: Grupo[] }) {
  const atualizar = useAtualizarConvidado();
  const excluir = useExcluirConvidado();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState({
    nome: c.nome,
    telefone: c.telefone ?? '',
    email: c.email ?? '',
    acompanhanteNome: c.acompanhanteNome ?? '',
  });

  const salvar = (dados: DadosConvidado) => atualizar.mutate({ id: c.id, ...dados });
  const salvarTexto = (k: keyof typeof texto) => {
    const valor = texto[k].trim();
    const atual = (k === 'nome' ? c.nome : (c[k] ?? '')).trim();
    if (valor === atual || (k === 'nome' && !valor)) return;
    salvar({ [k]: k === 'nome' ? valor : valor || null });
  };
  const textoProps = (k: keyof typeof texto) => ({
    value: texto[k],
    onChange: (e: { target: { value: string } }) => setTexto({ ...texto, [k]: e.target.value }),
    onBlur: () => salvarTexto(k),
    onKeyDown: (e: { key: string; currentTarget: HTMLInputElement }) => e.key === 'Enter' && e.currentTarget.blur(),
  });

  return (
    <li aria-label={c.nome} className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Avatar nome={c.nome} className="size-7 text-[0.6875rem]" />
        <input aria-label="Nome" maxLength={80} {...textoProps('nome')} className={`${campoPequeno} min-w-0 flex-1 font-medium`} />
        <div role="group" aria-label="Tipo" className="segmentos">
          {(Object.entries(LABEL_TIPO) as [Tipo, string][]).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={c.tipo === v} onClick={() => c.tipo !== v && salvar({ tipo: v })} className="segmento">
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-grafite-suave">{LABEL_RSVP[c.rsvp]}</span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto_auto] sm:items-center">
        <select aria-label="Lado" value={c.lado} onChange={(e) => salvar({ lado: e.target.value as Lado })} className={campoPequeno}>
          {Object.entries(LABEL_LADO).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Função"
          value={c.funcao ?? ''}
          onChange={(e) => salvar({ funcao: (e.target.value || null) as Funcao | null })}
          className={campoPequeno}
        >
          <option value="">Sem função</option>
          {Object.entries(LABEL_FUNCAO).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Grupo" value={c.grupoId} onChange={(e) => salvar({ grupoId: Number(e.target.value) })} className={campoPequeno}>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.acompanhantePermitido} onChange={(e) => salvar({ acompanhantePermitido: e.target.checked })} />
          +1
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.festa} onChange={(e) => salvar({ festa: e.target.checked })} />
          Festa
        </label>
      </div>
      <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)} className="acao-link mt-2 text-xs text-grafite-suave">
        {aberto ? 'Menos' : 'Mais: telefone, e-mail, acompanhante'}
      </button>
      {aberto && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="rotulo">Telefone (WhatsApp)</span>
            <input type="tel" {...textoProps('telefone')} className={campoPequeno} />
          </label>
          <label className="block">
            <span className="rotulo">E-mail</span>
            <input type="email" {...textoProps('email')} className={campoPequeno} />
          </label>
          {c.acompanhantePermitido && (
            <label className="block sm:col-span-2">
              <span className="rotulo">Nome do acompanhante</span>
              <input maxLength={80} {...textoProps('acompanhanteNome')} className={campoPequeno} />
            </label>
          )}
          <div className="sm:col-span-2">
            <BotaoSegurar disabled={excluir.isPending} onConfirmar={() => excluir.mutate(c.id)}>
              Excluir {c.nome}
            </BotaoSegurar>
          </div>
        </div>
      )}
      {atualizar.isError && (
        <p role="alert" className="mt-2 text-sm text-erro">
          {atualizar.error instanceof ApiError && atualizar.error.status === 400
            ? 'Confira o campo (telefone com DDD, e-mail válido).'
            : 'Não foi possível salvar.'}
        </p>
      )}
    </li>
  );
}
