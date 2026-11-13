import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { FileUpload } from '../../components/FileUpload';
import { api, ApiError } from '../../lib/api';
import { centavosParaInput, formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { urlArquivo } from '../../lib/upload';
import { FINANCEIRO_QUERY_KEY } from '../financeiro/useFinanceiro';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { moverNaLista } from '../site-admin/useSiteAdmin';

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
  linkLoja: string | null;
  ordem: number;
  ativo: boolean;
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
      <p className="mt-2 text-grafite-suave">Itens da lista e presentes recebidos. Só vocês veem quem deu e quanto.</p>
      <div role="tablist" aria-label="Presentes" className="mt-6 flex gap-2">
        {(
          [
            ['itens', 'Itens da lista'],
            ['recebidos', 'Presentes recebidos'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={aba === v} onClick={() => setAba(v)} className={`rounded-pill border px-4 py-1 ${aba === v ? 'border-rosa-antigo-escuro bg-rosa-antigo-claro text-rosa-antigo-escuro' : 'border-dourado-claro text-grafite-suave'}`}>
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

  if (isPending) return <p role="status">Carregando…</p>;
  if (isError || !data) return <p role="alert" className="text-rosa-antigo-escuro">Não foi possível carregar os itens.</p>;
  const ids = data.map((i) => i.id);

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setEditando('novo')} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim">
        Novo item
      </button>
      {data.length === 0 && <p className="text-grafite-suave">Nenhum item ainda.</p>}
      <ul className="space-y-2">
        {data.map((i, idx) => (
          <li key={i.id} className={`flex flex-wrap items-center gap-3 rounded-card border border-dourado-claro bg-white p-3 ${i.ativo ? '' : 'opacity-60'}`}>
            <span className="flex gap-1">
              <button type="button" aria-label={`Subir ${i.nome}`} disabled={idx === 0} onClick={() => ordenar.mutate(moverNaLista(ids, idx, -1))} className="px-2 disabled:opacity-30">↑</button>
              <button type="button" aria-label={`Descer ${i.nome}`} disabled={idx === ids.length - 1} onClick={() => ordenar.mutate(moverNaLista(ids, idx, 1))} className="px-2 disabled:opacity-30">↓</button>
            </span>
            {i.fotoUrl && <img src={i.fotoUrl} alt="" className="h-12 w-12 rounded object-cover" />}
            <button type="button" onClick={() => setEditando(i)} className="flex-1 text-left hover:text-rosa-antigo-escuro">
              <strong>{i.nome}</strong> · {formatarCentavos(i.precoCentavos)}
              {i.fracionavel ? ` · cotas: ${i.progresso}%` : ` · restam ${i.restante} de ${i.quantidade}`}
              {!i.ativo && ' · inativo'}
            </button>
            <span className="text-sm text-grafite-suave">arrecadado {formatarCentavos(i.arrecadadoCentavos)}</span>
          </li>
        ))}
      </ul>
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
    linkLoja: item?.linkLoja ?? '',
    ativo: item?.ativo ?? true,
    fotoArquivoId: item?.fotoArquivoId ?? null,
  });
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
        linkLoja: d.linkLoja.trim() || null,
        ativo: d.ativo,
        fotoArquivoId: d.fotoArquivoId,
      },
      { onSuccess: onClose },
    );
  }
  const set = (k: keyof typeof d, v: unknown) => {
    salvar.reset();
    setD({ ...d, [k]: v });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-grafite/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && !salvar.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={item ? 'Editar item' : 'Novo item'} className="max-h-full w-full max-w-lg overflow-y-auto rounded-card bg-marfim p-6 shadow-suave">
        <h2 className="text-2xl">{item ? 'Editar item' : 'Novo item'}</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
          <label className="block sm:col-span-2">
            <span className="text-sm text-grafite-suave">Nome</span>
            <input maxLength={100} value={d.nome} onChange={(e) => set('nome', e.target.value)} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-grafite-suave">Descrição</span>
            <textarea rows={2} maxLength={500} value={d.descricao} onChange={(e) => set('descricao', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-grafite-suave">Preço (R$)</span>
            <input inputMode="decimal" value={d.preco} onChange={(e) => set('preco', e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={d.fracionavel} onChange={(e) => set('fracionavel', e.target.checked)} />
            <span>Aceita cotas (pagamento online)</span>
          </label>
          {d.fracionavel ? (
            <label className="block">
              <span className="text-sm text-grafite-suave">Cota mínima (R$)</span>
              <input inputMode="decimal" value={d.cota} onChange={(e) => set('cota', e.target.value)} className={inputClass} />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm text-grafite-suave">Quantidade</span>
              <input type="number" min={1} value={d.quantidade} onChange={(e) => set('quantidade', e.target.value)} className={inputClass} />
            </label>
          )}
          <label className="block">
            <span className="text-sm text-grafite-suave">Link da loja (opcional)</span>
            <input type="url" value={d.linkLoja} onChange={(e) => set('linkLoja', e.target.value)} className={inputClass} />
          </label>
          <div className="sm:col-span-2">
            <FileUpload label="Foto" accept="image/jpeg,image/png,image/webp" onEnviado={(a) => set('fotoArquivoId', a.id)} />
            {d.fotoArquivoId && <p className="text-sm text-salvia-escuro">Foto definida.</p>}
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={d.ativo} onChange={(e) => set('ativo', e.target.checked)} />
            <span>Visível na lista</span>
          </label>
          {salvar.isError && (
            <p role="alert" className="text-rosa-antigo-escuro sm:col-span-2">
              {salvar.error instanceof ApiError ? salvar.error.message : 'Não foi possível salvar.'}
            </p>
          )}
          <div className="flex justify-between gap-2 sm:col-span-2">
            {item ? (
              <button type="button" onClick={() => excluir.mutate(item.id, { onSuccess: onClose })} className="text-rosa-antigo-escuro underline">
                Excluir (desativa se já houver presentes)
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-grafite-suave">Cancelar</button>
              <button type="submit" disabled={!valido || salvar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
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
          <span className="text-sm text-grafite-suave">Via</span>
          <select value={via} onChange={(e) => setVia(e.target.value)} className={inputClass}>
            <option value="">Todas</option>
            <option value="checkout">Pagamento online</option>
            <option value="loja">Loja</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {Object.entries(LABEL_STATUS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <a href="/api/painel/presentes/export.csv" download className="rounded-pill border border-rosa-antigo-escuro px-4 py-2 text-rosa-antigo-escuro">
          Exportar doações (CSV)
        </a>
        {extras}
      </div>
      {isPending && <p role="status">Carregando…</p>}
      {isError && <p role="alert" className="text-rosa-antigo-escuro">Não foi possível carregar os presentes.</p>}
      {data && data.length === 0 && <p className="text-grafite-suave">Nenhum presente ainda.</p>}
      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.id} aria-label={`Presente de ${p.doadorNome}`} className="rounded-card border border-dourado-claro bg-white p-3">
            <div className="flex flex-wrap items-center gap-3">
              <strong>{p.doadorNome}</strong>
              <span>{p.itemNome}</span>
              <span>{formatarCentavos(p.valorCentavos)}</span>
              <span className="rounded-pill bg-marfim-escuro px-2 text-sm">{LABEL_STATUS[p.status]}</span>
              <span className="text-sm text-grafite-suave">{p.via === 'loja' ? 'Loja' : `Online${p.metodo ? ` (${p.metodo === 'pix' ? 'PIX' : 'cartão'})` : ''}`}</span>
              <span className="text-sm text-grafite-suave">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
              {p.status === 'comprado' && (
                <button type="button" onClick={() => recebido.mutate(p.id)} className="ml-auto rounded-pill bg-salvia-escuro px-3 py-1 text-sm text-marfim">
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
                  <a href={urlArquivo(p.fotoArquivoId)} target="_blank" rel="noreferrer" className="underline">
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
