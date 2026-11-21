import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { FileUpload } from '../../components/FileUpload';
import { api, ApiError } from '../../lib/api';
import { centavosParaInput, formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { urlArquivo } from '../../lib/upload';
import { FINANCEIRO_QUERY_KEY } from '../financeiro/useFinanceiro';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { moverNaLista } from '../site-admin/useSiteAdmin';
import { nomeDaLoja, type LinkLoja } from '../presentes/usePresentes';
import { useViagens } from '../viagens/useViagens';
import { IconePainel } from '../painel/IconePainel';
import { Avatar } from '../painel/Avatar';
import { Esqueleto } from '../painel/Esqueleto';
import { Vazio } from '../painel/Vazio';
import { BotaoFechar } from '../painel/BotaoFechar';

export interface ItemPainel {
  id: number;
  nome: string;
  descricao: string;
  fotoUrl: string | null;
  fotoArquivoId: number | null;
  precoCentavos: number;
  quantidade: number;
  fracionavel: boolean;
  cotaMinimaCentavos: number;
  links: LinkLoja[];
  ordem: number;
  ativo: boolean;
  viagemId: number | null;
  restante: number;
  progresso: number;
  esgotado: boolean;
  arrecadadoCentavos: number;
}

export type StatusPresente = 'pendente' | 'pago' | 'expirado' | 'comprado' | 'recebido';

export interface PresentePainel {
  id: number;
  itemId: number;
  itemNome: string;
  via: 'checkout' | 'loja';
  status: StatusPresente;
  doadorNome: string;
  doadorEmail: string | null;
  mensagem: string;
  valorCentavos: number;
  valorCobradoCentavos: number | null;
  taxaCentavos: number | null;
  metodo: 'pix' | 'cartao' | null;
  numeroPedido: string | null;
  fotoArquivoId: number | null;
  criadoEm: string;
  pagoEm: string | null;
  recebidoEm: string | null;
}

const LABEL_STATUS: Record<StatusPresente, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  expirado: 'Expirado',
  comprado: 'Comprado',
  recebido: 'Recebido',
};

const ITENS_KEY = ['painel', 'presentes', 'itens'] as const;
const PRESENTES_KEY = ['painel', 'presentes', 'lista'] as const;

function useMutacaoItens<V>(fn: (v: V) => Promise<ItemPainel[]>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (itens) => {
      queryClient.setQueryData(ITENS_KEY, itens);
      void queryClient.invalidateQueries({ queryKey: ['publico', 'presentes'] });
    },
  });
}

type Aba = 'itens' | 'recebidos' | 'extras';

/** `extras` permite à história 13 incluir o export de doações. */
export function PresentesAdminPage({ extras }: { extras?: ReactNode } = {}) {
  const [aba, setAba] = useState<Aba>('itens');
  return (
    <section>
      <h1 className="text-4xl">Presentes</h1>
      <p className="mt-2 text-grafite-suave">Só vocês veem quem deu e quanto.</p>
      <div role="tablist" aria-label="Presentes" className="abas mt-6">
        {(
          [
            ['itens', 'Itens da lista'],
            ['recebidos', 'Presentes recebidos'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={aba === v} onClick={() => setAba(v)} className="aba">
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6">{aba === 'itens' ? <Itens /> : <Recebidos extras={extras} />}</div>
    </section>
  );
}

function Itens() {
  const { data, isPending, isError } = useQuery({ queryKey: ITENS_KEY, queryFn: () => api.get<ItemPainel[]>('/painel/presentes/itens') });
  const ordenar = useMutacaoItens((ids: number[]) => api.put<ItemPainel[]>('/painel/presentes/itens/ordem', { ids }));
  const [editando, setEditando] = useState<ItemPainel | 'novo' | null>(null);

  if (isPending) return <Esqueleto />;
  if (isError || !data) return <p role="alert" className="text-erro">Não foi possível carregar os itens.</p>;
  const ids = data.map((i) => i.id);

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setEditando('novo')} className="acao">
        <IconePainel nome="mais" />
        Novo item
      </button>
      {data.length === 0 && <Vazio icone="presentes">Nenhum item ainda.</Vazio>}
      {data.length > 0 && (
        <div className="cartao-painel overflow-x-auto p-0">
          <table className="tabela">
            <thead>
              <tr>
                <th className="w-20">
                  <span className="sr-only">Ordem</span>
                </th>
                <th>Item</th>
                <th className="num">Preço</th>
                <th>Disponível</th>
                <th className="num">Arrecadado</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((i, idx) => (
                <tr key={i.id} className={i.ativo ? '' : 'text-grafite-suave'}>
                  <td>
                    <span className="flex gap-1">
                      <button type="button" aria-label={`Subir ${i.nome}`} disabled={idx === 0} onClick={() => ordenar.mutate(moverNaLista(ids, idx, -1))} className="acao-discreta min-h-8 px-2 disabled:opacity-30">↑</button>
                      <button type="button" aria-label={`Descer ${i.nome}`} disabled={idx === ids.length - 1} onClick={() => ordenar.mutate(moverNaLista(ids, idx, 1))} className="acao-discreta min-h-8 px-2 disabled:opacity-30">↓</button>
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => setEditando(i)} className="flex items-center gap-3 text-left hover:text-grafite">
                      {i.fotoUrl ? (
                        <img src={i.fotoUrl} alt="" className="h-10 w-10 shrink-0 rounded-card object-cover" />
                      ) : (
                        <span aria-hidden="true" className="h-10 w-10 shrink-0 rounded-card bg-nevoa-escuro" />
                      )}
                      <span className="font-medium">{i.nome}</span>
                      {!i.ativo && <span className="selo bg-nevoa-escuro text-grafite-suave">Inativo</span>}
                    </button>
                  </td>
                  <td className="num">{formatarCentavos(i.precoCentavos)}</td>
                  <td className="min-w-40">
                    {i.fracionavel ? (
                      <div className="flex items-center gap-3">
                        <div className="barra flex-1" aria-hidden="true">
                          <span style={{ width: `${i.progresso}%` }} />
                        </div>
                        <span className="text-sm tabular-nums">{i.progresso}%</span>
                      </div>
                    ) : (
                      <span className="text-sm">
                        {i.restante} de {i.quantidade}
                      </span>
                    )}
                  </td>
                  <td className="num">{formatarCentavos(i.arrecadadoCentavos)}</td>
                  <td>
                    <button type="button" aria-label={`Editar ${i.nome}`} onClick={() => setEditando(i)} className="acao-secundaria min-h-8 px-3 text-sm">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editando && <ItemModal item={editando === 'novo' ? null : editando} onClose={() => setEditando(null)} />}
    </div>
  );
}

function ItemModal({ item, onClose }: { item: ItemPainel | null; onClose: () => void }) {
  const salvar = useMutacaoItens((dados: Record<string, unknown>) =>
    item ? api.put<ItemPainel[]>(`/painel/presentes/itens/${item.id}`, dados) : api.post<ItemPainel[]>('/painel/presentes/itens', dados),
  );
  const excluir = useMutacaoItens((id: number) => api.del<ItemPainel[]>(`/painel/presentes/itens/${id}`));
  const [d, setD] = useState({
    nome: item?.nome ?? '',
    descricao: item?.descricao ?? '',
    preco: item ? centavosParaInput(item.precoCentavos) : '',
    quantidade: String(item?.quantidade ?? 1),
    fracionavel: item?.fracionavel ?? false,
    cota: centavosParaInput(item?.cotaMinimaCentavos ?? 5000),
    links: item?.links.length ? item.links : [{ url: '', rotulo: '' }],
    ativo: item?.ativo ?? true,
    fotoArquivoId: item?.fotoArquivoId ?? null,
    viagemId: item?.viagemId ?? null,
  });
  const viagens = useViagens();
  const preco = parseCentavos(d.preco);
  const cota = parseCentavos(d.cota);
  const qtd = Number(d.quantidade);
  const valido = d.nome.trim() !== '' && preco !== null && preco > 0 && cota !== null && cota > 0 && Number.isInteger(qtd) && qtd >= 1;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valido) return;
    salvar.mutate(
      {
        nome: d.nome.trim(),
        descricao: d.descricao.trim(),
        precoCentavos: preco,
        quantidade: d.fracionavel ? 1 : qtd,
        fracionavel: d.fracionavel,
        cotaMinimaCentavos: cota,
        links: d.links.map((l) => ({ url: l.url.trim(), rotulo: l.rotulo.trim() })).filter((l) => l.url),
        ativo: d.ativo,
        fotoArquivoId: d.fotoArquivoId,
        viagemId: d.viagemId,
      },
      { onSuccess: onClose },
    );
  }
  const set = (k: keyof typeof d, v: unknown) => {
    salvar.reset();
    setD({ ...d, [k]: v });
  };

  return (
    <div className="dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && !salvar.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={item ? 'Editar item' : 'Novo item'} className="dialogo">
        <div className="flex items-start justify-between gap-4">
          <h2 className="titulo-dialogo">{item ? 'Editar item' : 'Novo item'}</h2>
          <BotaoFechar onClick={onClose} disabled={salvar.isPending} />
        </div>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
          <label className="block sm:col-span-2">
            <span className="rotulo">Nome</span>
            <input maxLength={100} value={d.nome} onChange={(e) => set('nome', e.target.value)} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="rotulo">Descrição</span>
            <textarea rows={2} maxLength={500} value={d.descricao} onChange={(e) => set('descricao', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="rotulo">Preço (R$)</span>
            <input inputMode="decimal" value={d.preco} onChange={(e) => set('preco', e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={d.fracionavel} onChange={(e) => set('fracionavel', e.target.checked)} />
            <span>Aceita cotas (pagamento online)</span>
          </label>
          {d.fracionavel ? (
            <label className="block">
              <span className="rotulo">Cota mínima (R$)</span>
              <input inputMode="decimal" value={d.cota} onChange={(e) => set('cota', e.target.value)} className={inputClass} />
            </label>
          ) : (
            <label className="block">
              <span className="rotulo">Quantidade</span>
              <input type="number" min={1} value={d.quantidade} onChange={(e) => set('quantidade', e.target.value)} className={inputClass} />
            </label>
          )}
          <Links links={d.links} onChange={(links) => set('links', links)} onFoto={(id) => set('fotoArquivoId', id)} />
          <label className="block sm:col-span-2">
            <span className="rotulo">Para uma viagem (opcional)</span>
            <select value={d.viagemId ?? ''} onChange={(e) => set('viagemId', e.target.value === '' ? null : Number(e.target.value))} className={inputClass}>
              <option value="">Nenhuma</option>
              {viagens.data?.map((v) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-4 sm:col-span-2">
            {d.fotoArquivoId ? (
              <img
                src={d.fotoArquivoId === item?.fotoArquivoId && item.fotoUrl ? item.fotoUrl : urlArquivo(d.fotoArquivoId)}
                alt="Foto do item"
                className="size-20 shrink-0 rounded-card object-cover"
              />
            ) : (
              <span aria-hidden="true" className="size-20 shrink-0 rounded-card bg-nevoa-escuro" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <FileUpload label="Foto" accept="image/jpeg,image/png,image/webp" onEnviado={(a) => set('fotoArquivoId', a.id)} />
              <FotoPorEndereco onFoto={(id) => set('fotoArquivoId', id)} />
            </div>
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={d.ativo} onChange={(e) => set('ativo', e.target.checked)} />
            <span>Visível na lista</span>
          </label>
          {salvar.isError && (
            <p role="alert" className="text-erro sm:col-span-2">
              {salvar.error instanceof ApiError ? salvar.error.message : 'Não foi possível salvar.'}
            </p>
          )}
          <div className="flex justify-between gap-2 sm:col-span-2">
            {item ? (
              <button type="button" onClick={() => excluir.mutate(item.id, { onSuccess: onClose })} className="acao-perigo">
                Excluir (desativa se já houver presentes)
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="acao-discreta">Cancelar</button>
              <button type="submit" disabled={!valido || salvar.isPending} className="acao">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const usePegarFoto = (onFoto: (arquivoId: number) => void) =>
  useMutation({
    mutationFn: (url: string) => api.post<{ id: number }>('/painel/presentes/foto-do-link', { url }),
    onSuccess: (a) => onFoto(a.id),
  });

/** Quando a loja bloqueia a busca automática: cola o endereço da própria imagem. */
function FotoPorEndereco({ onFoto }: { onFoto: (arquivoId: number) => void }) {
  const foto = usePegarFoto(onFoto);
  const [url, setUrl] = useState('');
  const valido = /^https?:\/\//.test(url.trim());
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          aria-label="Endereço da imagem"
          placeholder="Endereço da imagem (https://…)"
          value={url}
          onChange={(e) => {
            foto.reset();
            setUrl(e.target.value);
          }}
          className={`${inputClass} mt-0 min-w-0 flex-1`}
        />
        <button type="button" disabled={!valido || foto.isPending} onClick={() => foto.mutate(url.trim())} className="acao-secundaria min-h-9 shrink-0 px-3 text-sm">
          {foto.isPending ? 'Buscando…' : 'Usar'}
        </button>
      </div>
      {foto.isError && (
        <p role="alert" className="mt-1 text-sm text-erro">
          {foto.error instanceof ApiError ? foto.error.message : 'Não foi possível pegar a imagem.'}
        </p>
      )}
    </div>
  );
}

const MAX_LINKS = 5;

/** Lojas do item (até 5). Cada link pode trazer a foto do produto. */
function Links({ links, onChange, onFoto }: { links: LinkLoja[]; onChange: (l: LinkLoja[]) => void; onFoto: (arquivoId: number) => void }) {
  const foto = usePegarFoto(onFoto);
  const mudar = (i: number, campo: keyof LinkLoja, valor: string) =>
    onChange(links.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="rotulo">Links das lojas (opcional)</legend>
      {links.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            type="url"
            aria-label={`Link ${i + 1}`}
            placeholder="https://…"
            value={l.url}
            onChange={(e) => mudar(i, 'url', e.target.value)}
            className={`${inputClass} mt-0 min-w-0 flex-[3]`}
          />
          <input
            aria-label={`Nome da loja ${i + 1}`}
            placeholder={l.url ? nomeDaLoja(l) : 'Nome da loja'}
            maxLength={40}
            value={l.rotulo}
            onChange={(e) => mudar(i, 'rotulo', e.target.value)}
            className={`${inputClass} mt-0 min-w-0 flex-[2]`}
          />
          <button
            type="button"
            disabled={!/^https?:\/\//.test(l.url.trim()) || foto.isPending}
            onClick={() => foto.mutate(l.url.trim())}
            className="acao-secundaria min-h-9 px-3 text-sm"
          >
            {foto.isPending && foto.variables === l.url.trim() ? 'Buscando…' : 'Pegar foto'}
          </button>
          <button
            type="button"
            aria-label={`Remover link ${i + 1}`}
            onClick={() => onChange(links.length === 1 ? [{ url: '', rotulo: '' }] : links.filter((_, j) => j !== i))}
            className="acao-discreta min-h-9 px-2"
          >
            <IconePainel nome="fechar" />
          </button>
        </div>
      ))}
      {links.length < MAX_LINKS && (
        <button type="button" onClick={() => onChange([...links, { url: '', rotulo: '' }])} className="acao-link text-sm">
          + Outro link
        </button>
      )}
      {foto.isError && (
        <p role="alert" className="text-sm text-erro">
          {foto.error instanceof ApiError ? foto.error.message : 'Não foi possível pegar a foto.'}
        </p>
      )}
      {foto.isSuccess && <p role="status" className="text-sm text-rose-fundo">Foto do link definida.</p>}
    </fieldset>
  );
}

function Recebidos({ extras }: { extras?: ReactNode }) {
  const queryClient = useQueryClient();
  const [via, setVia] = useState('');
  const [status, setStatus] = useState('');
  const qs = new URLSearchParams({ ...(via ? { via } : {}), ...(status ? { status } : {}) }).toString();
  const { data, isPending, isError } = useQuery({
    queryKey: [...PRESENTES_KEY, via, status],
    queryFn: () => api.get<PresentePainel[]>(`/painel/presentes${qs ? `?${qs}` : ''}`),
  });
  const recebido = useMutation({
    mutationFn: (id: number) => api.post<PresentePainel>(`/painel/presentes/${id}/recebido`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRESENTES_KEY });
      void queryClient.invalidateQueries({ queryKey: FINANCEIRO_QUERY_KEY });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="rotulo">Via</span>
          <select value={via} onChange={(e) => setVia(e.target.value)} className={inputClass}>
            <option value="">Todas</option>
            <option value="checkout">Pagamento online</option>
            <option value="loja">Loja</option>
          </select>
        </label>
        <label className="block">
          <span className="rotulo">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {Object.entries(LABEL_STATUS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <a href="/api/painel/presentes/export.csv" download className="acao-secundaria">
          Exportar doações (CSV)
        </a>
        {extras}
      </div>
      {isPending && <Esqueleto />}
      {isError && <p role="alert" className="text-erro">Não foi possível carregar os presentes.</p>}
      {data && data.length === 0 && <Vazio icone="presentes">Nenhum presente ainda.</Vazio>}
      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.id} aria-label={`Presente de ${p.doadorNome}`} className="cartao-painel px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-2.5">
                <Avatar nome={p.doadorNome} />
                <strong className="font-semibold">{p.doadorNome}</strong>
              </span>
              <span className="text-grafite-suave">{p.itemNome}</span>
              <span className="font-semibold tabular-nums">{formatarCentavos(p.valorCentavos)}</span>
              <span className="selo bg-nevoa-escuro text-grafite-suave">{LABEL_STATUS[p.status]}</span>
              <span className="rotulo">{p.via === 'loja' ? 'Loja' : `Online${p.metodo ? ` (${p.metodo === 'pix' ? 'PIX' : 'cartão'})` : ''}`}</span>
              <span className="rotulo">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
              {p.status === 'comprado' && (
                <button type="button" onClick={() => recebido.mutate(p.id)} className="acao ml-auto min-h-8 px-3 py-1 text-sm">
                  Marcar recebido
                </button>
              )}
            </div>
            {(p.mensagem || p.numeroPedido || p.doadorEmail || p.fotoArquivoId) && (
              <p className="mt-1 text-sm text-grafite-suave">
                {p.mensagem && <>“{p.mensagem}” </>}
                {p.numeroPedido && <>· pedido {p.numeroPedido} </>}
                {p.doadorEmail && <>· {p.doadorEmail} </>}
                {p.fotoArquivoId && (
                  <a href={urlArquivo(p.fotoArquivoId)} target="_blank" rel="noreferrer" className="acao-link">
                    · foto
                  </a>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
