import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FileUpload } from '../../components/FileUpload';
import { api, ApiError } from '../../lib/api';
import { formatDataCurta } from '../../lib/date';
import { centavosParaInput, formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { urlArquivo } from '../../lib/upload';
import { useCategorias } from '../financeiro/useFinanceiro';
import { inputClass } from '../fornecedores/FornecedoresPage';
import {
  LABEL_DONO,
  LABEL_TIPO_RESERVA,
  useEditarViagem,
  useViagem,
  type Dono,
  type Reserva,
  type TipoReserva,
  type ViagemDetalhe,
} from './useViagens';
import { BotaoSegurar } from '../painel/BotaoSegurar';
import { Esqueleto } from '../painel/Esqueleto';
import { Vazio } from '../painel/Vazio';

type Aba = 'roteiro' | 'reservas' | 'mala';

export function ViagemPage() {
  const id = Number(useParams().id);
  const { data, isPending, isError } = useViagem(id);
  const [aba, setAba] = useState<Aba>('roteiro');
  const navigate = useNavigate();
  const excluir = useEditarViagem(id, () => api.del<ViagemDetalhe>(`/painel/viagens/${id}`));
  const [editando, setEditando] = useState(false);

  if (isPending) return <Esqueleto />;
  if (isError || !data) {
    return (
      <p role="alert" className="text-erro">
        Viagem não encontrada. <Link to="/painel/viagens" className="acao-link">Voltar</Link>
      </p>
    );
  }

  return (
    <section>
      <nav aria-label="Caminho" className="flex items-center gap-1.5 text-sm text-grafite-suave">
        <Link to="/painel/viagens" className="transition-colors hover:text-grafite">
          Viagens
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-grafite">{data.nome}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl">{data.nome}</h1>
          <p className="text-grafite-suave">
            {data.destino && `${data.destino} · `}
            {formatDataCurta(data.dataInicio)} a {formatDataCurta(data.dataFim)}
          </p>
        </div>
        <button type="button" aria-expanded={editando} onClick={() => setEditando(!editando)} className="acao-secundaria">
          {editando ? 'Fechar' : 'Editar viagem'}
        </button>
      </div>
      {editando && <EditarViagem key={JSON.stringify([data.nome, data.destino, data.dataInicio, data.dataFim])} v={data} onFechar={() => setEditando(false)} />}
      <div role="tablist" aria-label="Partes da viagem" className="abas mt-6">
        {(
          [
            ['roteiro', 'Roteiro'],
            ['reservas', 'Reservas'],
            ['mala', 'Mala'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={aba === v} onClick={() => setAba(v)} className="aba">
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {aba === 'roteiro' && <Roteiro v={data} />}
        {aba === 'reservas' && <Reservas v={data} />}
        {aba === 'mala' && <Mala v={data} />}
      </div>
      <div className="mt-10 border-t border-linha pt-4">
        <BotaoSegurar
          disabled={excluir.isPending}
          onConfirmar={() => excluir.mutate(undefined, { onSuccess: () => void navigate('/painel/viagens') })}
        >
          Excluir viagem
        </BotaoSegurar>
        <p className="mt-2 text-[0.8125rem] text-grafite-suave">Reservas e gastos espelhados no financeiro também saem.</p>
      </div>
    </section>
  );
}

function Roteiro({ v }: { v: ViagemDetalhe }) {
  const salvar = useEditarViagem(v.id, (d: object) => api.post<ViagemDetalhe>(`/painel/viagens/${v.id}/roteiro`, d));
  const excluir = useEditarViagem(v.id, (itemId: number) => api.del<ViagemDetalhe>(`/painel/viagens/${v.id}/roteiro/${itemId}`));
  const [d, setD] = useState({ data: v.dataInicio, horario: '', titulo: '', local: '' });
  const dias = [...new Set(v.roteiro.map((r) => r.data))];

  return (
    <div className="space-y-6">
      {dias.length === 0 && <Vazio icone="calendario">Nenhum item no roteiro.</Vazio>}
      {dias.map((dia) => (
        <div key={dia}>
          <h2 className="text-xl text-rose-fundo">{formatDataCurta(dia)}</h2>
          <ol className="mt-2 border-l border-linha-forte pl-4">
            {v.roteiro
              .filter((r) => r.data === dia)
              .map((r) => (
                <ItemRoteiro key={JSON.stringify(r)} v={v} r={r} onExcluir={() => excluir.mutate(r.id)} />
              ))}
          </ol>
        </div>
      ))}
      <form
        aria-label="Novo item do roteiro"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          if (!d.titulo.trim()) return;
          salvar.mutate({ data: d.data, horario: d.horario || null, titulo: d.titulo.trim(), local: d.local.trim() }, { onSuccess: () => setD({ ...d, titulo: '', local: '', horario: '' }) });
        }}
        className="grid gap-3 cartao-painel sm:grid-cols-4"
      >
        <label className="block">
          <span className="rotulo">Dia</span>
          <input type="date" min={v.dataInicio} max={v.dataFim} value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Horário</span>
          <input type="time" value={d.horario} onChange={(e) => setD({ ...d, horario: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="rotulo">O quê</span>
          <input maxLength={120} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-3">
          <span className="rotulo">Local</span>
          <input maxLength={200} value={d.local} onChange={(e) => setD({ ...d, local: e.target.value })} className={inputClass} />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={!d.titulo.trim() || salvar.isPending} className="acao w-full">
            Adicionar
          </button>
        </div>
        {salvar.isError && (
          <p role="alert" className="text-sm text-erro sm:col-span-4">
            {salvar.error instanceof ApiError && salvar.error.code === 'DATA_FORA_DA_VIAGEM' ? 'A data precisa estar dentro da viagem.' : 'Não foi possível salvar.'}
          </p>
        )}
      </form>
    </div>
  );
}

type ItemRoteiroDados = ViagemDetalhe['roteiro'][number];

function ItemRoteiro({ v, r, onExcluir }: { v: ViagemDetalhe; r: ItemRoteiroDados; onExcluir: () => void }) {
  const salvar = useEditarViagem(v.id, (d: object) => api.put<ViagemDetalhe>(`/painel/viagens/${v.id}/roteiro/${r.id}`, d));
  const [editando, setEditando] = useState(false);
  const [d, setD] = useState({ data: r.data, horario: r.horario ?? '', titulo: r.titulo, local: r.local });

  if (!editando) {
    return (
      <li className="mb-3">
        <span className="font-semibold">{r.horario ?? '—'}</span> {r.titulo}
        {r.local && <span className="text-grafite-suave"> · {r.local}</span>}
        <button type="button" aria-label={`Editar ${r.titulo}`} onClick={() => setEditando(true)} className="ml-2 text-sm acao-link">
          editar
        </button>
        <button type="button" aria-label={`Excluir ${r.titulo}`} onClick={onExcluir} className="ml-2 text-sm acao-perigo">
          excluir
        </button>
      </li>
    );
  }
  return (
    <li className="mb-3">
      <form
        aria-label={`Editar ${r.titulo}`}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          if (!d.titulo.trim()) return;
          salvar.mutate(
            { data: d.data, horario: d.horario || null, titulo: d.titulo.trim(), descricao: r.descricao, local: d.local.trim() },
            { onSuccess: () => setEditando(false) },
          );
        }}
        className="grid gap-2 rounded-card bg-nevoa p-3 sm:grid-cols-4"
      >
        <label className="block">
          <span className="rotulo">Dia</span>
          <input type="date" min={v.dataInicio} max={v.dataFim} value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Horário</span>
          <input type="time" value={d.horario} onChange={(e) => setD({ ...d, horario: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="rotulo">O quê</span>
          <input maxLength={120} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-4">
          <span className="rotulo">Local</span>
          <input maxLength={200} value={d.local} onChange={(e) => setD({ ...d, local: e.target.value })} className={inputClass} />
        </label>
        {salvar.isError && (
          <p role="alert" className="text-sm text-erro sm:col-span-4">
            {salvar.error instanceof ApiError ? salvar.error.message : 'Não foi possível salvar.'}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-4">
          <button type="submit" disabled={!d.titulo.trim() || salvar.isPending} className="acao">
            Salvar
          </button>
          <button type="button" onClick={() => setEditando(false)} className="acao-discreta">
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}

function Reservas({ v }: { v: ViagemDetalhe }) {
  const categorias = useCategorias();
  const criar = useEditarViagem(v.id, (d: object) => api.post<ViagemDetalhe>(`/painel/viagens/${v.id}/reservas`, d));
  const [d, setD] = useState({ tipo: 'hospedagem' as TipoReserva, descricao: '', codigo: '', data: v.dataInicio, valor: '', categoria: '', pago: false });
  const [voucher, setVoucher] = useState<number | null>(null);
  const valor = d.valor ? parseCentavos(d.valor) : null;

  return (
    <div className="space-y-4">
      {v.reservas.length === 0 && <Vazio icone="viagens">Nenhuma reserva.</Vazio>}
      {v.reservas.map((r) => (
        <CartaoReserva key={r.id} viagemId={v.id} r={r} />
      ))}
      <form
        aria-label="Nova reserva"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          if (!d.descricao.trim() || (d.valor && valor === null)) return;
          criar.mutate(
            {
              tipo: d.tipo,
              descricao: d.descricao.trim(),
              codigo: d.codigo.trim(),
              data: d.data,
              valorCentavos: valor,
              statusPagamento: d.pago ? 'pago' : 'pendente',
              categoriaFinanceiraId: d.categoria ? Number(d.categoria) : null,
              voucherArquivoId: voucher,
            },
            { onSuccess: () => setD({ ...d, descricao: '', codigo: '', valor: '' }) },
          );
        }}
        className="grid gap-3 cartao-painel sm:grid-cols-3"
      >
        <label className="block">
          <span className="rotulo">Tipo</span>
          <select value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value as TipoReserva })} className={inputClass}>
            {Object.entries(LABEL_TIPO_RESERVA).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="rotulo">Descrição</span>
          <input maxLength={140} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Código</span>
          <input maxLength={80} value={d.codigo} onChange={(e) => setD({ ...d, codigo: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Data</span>
          <input type="date" value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Valor (R$, opcional)</span>
          <input inputMode="decimal" value={d.valor} onChange={(e) => setD({ ...d, valor: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Lançar no financeiro em</span>
          <select value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} className={inputClass}>
            <option value="">Não lançar</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" checked={d.pago} onChange={(e) => setD({ ...d, pago: e.target.checked })} />
          <span>Já pago</span>
        </label>
        <div>
          <FileUpload label="Voucher" onEnviado={(a) => setVoucher(a.id)} />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" disabled={!d.descricao.trim() || criar.isPending} className="acao">
            Adicionar reserva
          </button>
          {criar.isError && <span role="alert" className="ml-3 text-erro">Não foi possível salvar.</span>}
        </div>
      </form>
    </div>
  );
}

/** Nome, destino e datas da viagem. */
function EditarViagem({ v, onFechar }: { v: ViagemDetalhe; onFechar: () => void }) {
  const salvar = useEditarViagem(v.id, (d: object) => api.put<ViagemDetalhe>(`/painel/viagens/${v.id}`, d));
  const [d, setD] = useState({ nome: v.nome, destino: v.destino, dataInicio: v.dataInicio, dataFim: v.dataFim });
  const valido = d.nome.trim() !== '' && !!d.dataInicio && !!d.dataFim && d.dataFim >= d.dataInicio;
  return (
    <form
      aria-label="Editar viagem"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (valido) salvar.mutate({ ...d, nome: d.nome.trim(), destino: d.destino.trim() }, { onSuccess: onFechar });
      }}
      className="mt-4 grid gap-3 cartao-painel sm:grid-cols-4"
    >
      <label className="block sm:col-span-2">
        <span className="rotulo">Nome</span>
        <input maxLength={80} value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} className={inputClass} />
      </label>
      <label className="block sm:col-span-2">
        <span className="rotulo">Destino</span>
        <input maxLength={120} value={d.destino} onChange={(e) => setD({ ...d, destino: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Início</span>
        <input type="date" value={d.dataInicio} onChange={(e) => setD({ ...d, dataInicio: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Fim</span>
        <input type="date" value={d.dataFim} onChange={(e) => setD({ ...d, dataFim: e.target.value })} className={inputClass} />
      </label>
      {d.dataFim < d.dataInicio && (
        <p role="alert" className="text-sm text-erro sm:col-span-4">
          O fim precisa ser depois do início.
        </p>
      )}
      {salvar.isError && (
        <p role="alert" className="text-sm text-erro sm:col-span-4">
          {salvar.error instanceof ApiError ? salvar.error.message : 'Não foi possível salvar a viagem.'}
        </p>
      )}
      <div className="flex items-end gap-2 sm:col-span-2">
        <button type="submit" disabled={!valido || salvar.isPending} className="acao">
          Salvar
        </button>
        <button type="button" onClick={onFechar} className="acao-discreta">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Todos os campos de uma reserva; o espelho no financeiro acompanha. */
function EditarReserva({ viagemId, r, onFechar }: { viagemId: number; r: Reserva; onFechar: () => void }) {
  const categorias = useCategorias();
  const salvar = useEditarViagem(viagemId, (d: object) => api.put<ViagemDetalhe>(`/painel/viagens/${viagemId}/reservas/${r.id}`, d));
  const [d, setD] = useState({
    tipo: r.tipo,
    descricao: r.descricao,
    codigo: r.codigo,
    data: r.data,
    valor: r.valorCentavos === null ? '' : centavosParaInput(r.valorCentavos),
    categoria: r.categoriaFinanceiraId === null ? '' : String(r.categoriaFinanceiraId),
  });
  const [voucher, setVoucher] = useState(r.voucherArquivoId);
  const valor = d.valor.trim() ? parseCentavos(d.valor) : null;
  const valido = d.descricao.trim() !== '' && !(d.valor.trim() && (valor === null || valor <= 0));

  return (
    <form
      aria-label={`Editar reserva ${r.descricao}`}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!valido) return;
        salvar.mutate(
          {
            tipo: d.tipo,
            descricao: d.descricao.trim(),
            codigo: d.codigo.trim(),
            data: d.data,
            valorCentavos: valor,
            categoriaFinanceiraId: d.categoria ? Number(d.categoria) : null,
            voucherArquivoId: voucher,
          },
          { onSuccess: onFechar },
        );
      }}
      className="mt-3 grid gap-3 rounded-card bg-nevoa p-3 sm:grid-cols-3"
    >
      <label className="block">
        <span className="rotulo">Tipo</span>
        <select value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value as TipoReserva })} className={inputClass}>
          {Object.entries(LABEL_TIPO_RESERVA).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="rotulo">Descrição</span>
        <input maxLength={140} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Código</span>
        <input maxLength={80} value={d.codigo} onChange={(e) => setD({ ...d, codigo: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Data</span>
        <input type="date" value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Valor (R$)</span>
        <input inputMode="decimal" value={d.valor} onChange={(e) => setD({ ...d, valor: e.target.value })} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Lançar no financeiro em</span>
        <select value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} className={inputClass}>
          <option value="">Não lançar</option>
          {categorias.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
        <FileUpload label="Trocar voucher" onEnviado={(a) => setVoucher(a.id)} />
      </div>
      {salvar.isError && (
        <p role="alert" className="text-sm text-erro sm:col-span-3">
          {salvar.error instanceof ApiError ? salvar.error.message : 'Não foi possível salvar a reserva.'}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={!valido || salvar.isPending} className="acao">
          Salvar
        </button>
        <button type="button" onClick={onFechar} className="acao-discreta">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CartaoReserva({ viagemId, r }: { viagemId: number; r: Reserva }) {
  const atualizar = useEditarViagem(viagemId, (d: object) => api.put<ViagemDetalhe>(`/painel/viagens/${viagemId}/reservas/${r.id}`, d));
  const excluir = useEditarViagem(viagemId, () => api.del<ViagemDetalhe>(`/painel/viagens/${viagemId}/reservas/${r.id}`));
  const [editando, setEditando] = useState(false);
  return (
    <article aria-label={`Reserva ${r.descricao}`} className="cartao-painel">
      <p className="text-sm text-grafite-suave">{LABEL_TIPO_RESERVA[r.tipo]} · {formatDataCurta(r.data)}</p>
      <h3 className="text-xl">{r.descricao}</h3>
      {r.codigo && <p className="mt-1 font-mono text-2xl tracking-wider">{r.codigo}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {r.valorCentavos !== null && <span>{formatarCentavos(r.valorCentavos)}</span>}
        <span className={`selo ${r.statusPagamento === 'pago' ? 'bg-rose-claro text-rose-fundo' : 'bg-nevoa-escuro text-grafite-suave'}`}>{r.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}</span>
        {r.contratoId !== null && <span className="text-grafite-suave">no financeiro</span>}
        {r.voucherArquivoId && (
          <a href={urlArquivo(r.voucherArquivoId)} target="_blank" rel="noreferrer" className="acao min-h-9 px-3 py-1">
            Abrir voucher
          </a>
        )}
        <button type="button" onClick={() => atualizar.mutate({ statusPagamento: r.statusPagamento === 'pago' ? 'pendente' : 'pago' })} className="acao-link">
          {r.statusPagamento === 'pago' ? 'Marcar pendente' : 'Marcar pago'}
        </button>
        <button type="button" aria-expanded={editando} onClick={() => setEditando(!editando)} className="acao-link">
          {editando ? 'Fechar' : 'Editar'}
        </button>
        <button type="button" onClick={() => excluir.mutate(undefined)} className="acao-perigo">
          Excluir
        </button>
      </div>
      {editando && <EditarReserva key={JSON.stringify(r)} viagemId={viagemId} r={r} onFechar={() => setEditando(false)} />}
    </article>
  );
}

function Mala({ v }: { v: ViagemDetalhe }) {
  const criar = useEditarViagem(v.id, (d: object) => api.post<ViagemDetalhe>(`/painel/viagens/${v.id}/mala`, d));
  const marcar = useEditarViagem(v.id, ({ id, naMala }: { id: number; naMala: boolean }) => api.put<ViagemDetalhe>(`/painel/viagens/${v.id}/mala/${id}`, { naMala }));
  const excluir = useEditarViagem(v.id, (id: number) => api.del<ViagemDetalhe>(`/painel/viagens/${v.id}/mala/${id}`));
  const [d, setD] = useState({ descricao: '', categoria: '', dono: 'ambos' as Dono });

  return (
    <div className="space-y-4">
      <ul aria-label="Progresso da mala" className="flex flex-wrap gap-3">
        {(Object.keys(LABEL_DONO) as Dono[]).map((dono) => (
          <li key={dono} className="cartao-painel px-4 py-2">
            {LABEL_DONO[dono]}: {v.progressoMala[dono].naMala}/{v.progressoMala[dono].total}
          </li>
        ))}
      </ul>
      <ul className="space-y-1">
        {v.mala.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2">
              <input type="checkbox" checked={m.naMala} onChange={(e) => marcar.mutate({ id: m.id, naMala: e.target.checked })} />
              <span className={m.naMala ? 'text-grafite-suave line-through' : ''}>{m.descricao}</span>
              <span className="text-xs text-grafite-suave">
                {m.categoria} · {LABEL_DONO[m.dono]}
              </span>
            </label>
            <button type="button" aria-label={`Remover ${m.descricao}`} onClick={() => excluir.mutate(m.id)} className="text-sm text-grafite-suave">
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        aria-label="Novo item da mala"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          if (!d.descricao.trim()) return;
          criar.mutate({ descricao: d.descricao.trim(), categoria: d.categoria.trim() || undefined, dono: d.dono }, { onSuccess: () => setD({ ...d, descricao: '' }) });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="block">
          <span className="rotulo">Item</span>
          <input maxLength={120} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Categoria</span>
          <input maxLength={60} value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} placeholder="Roupas, Praia…" className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">De quem</span>
          <select value={d.dono} onChange={(e) => setD({ ...d, dono: e.target.value as Dono })} className={inputClass}>
            {Object.entries(LABEL_DONO).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!d.descricao.trim()} className="acao">
          Adicionar
        </button>
      </form>
    </div>
  );
}
