import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FileUpload } from '../../components/FileUpload';
import { api, ApiError } from '../../lib/api';
import { formatDataCurta } from '../../lib/date';
import { formatarCentavos, parseCentavos } from '../../lib/dinheiro';
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

type Aba = 'roteiro' | 'reservas' | 'mala';

export function ViagemPage() {
  const id = Number(useParams().id);
  const { data, isPending, isError } = useViagem(id);
  const [aba, setAba] = useState<Aba>('roteiro');
  const navigate = useNavigate();
  const excluir = useEditarViagem(id, () => api.del<ViagemDetalhe>(`/painel/viagens/${id}`));
  const [confirmando, setConfirmando] = useState(false);

  if (isPending) return <p role="status">Carregando…</p>;
  if (isError || !data) {
    return (
      <p role="alert" className="text-rosa-antigo-escuro">
        Viagem não encontrada. <Link to="/painel/viagens" className="underline">Voltar</Link>
      </p>
    );
  }

  return (
    <section>
      <Link to="/painel/viagens" className="text-sm text-grafite-suave underline">
        ← Viagens
      </Link>
      <h1 className="mt-2 text-4xl">{data.nome}</h1>
      <p className="text-grafite-suave">
        {data.destino && `${data.destino} · `}
        {formatDataCurta(data.dataInicio)} a {formatDataCurta(data.dataFim)}
      </p>
      <div role="tablist" aria-label="Partes da viagem" className="mt-6 flex gap-2">
        {(
          [
            ['roteiro', 'Roteiro'],
            ['reservas', 'Reservas'],
            ['mala', 'Mala'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} role="tab" type="button" aria-selected={aba === v} onClick={() => setAba(v)} className={`rounded-pill border px-4 py-1 ${aba === v ? 'border-rosa-antigo-escuro bg-rosa-antigo-claro text-rosa-antigo-escuro' : 'border-dourado-claro text-grafite-suave'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {aba === 'roteiro' && <Roteiro v={data} />}
        {aba === 'reservas' && <Reservas v={data} />}
        {aba === 'mala' && <Mala v={data} />}
      </div>
      <div className="mt-10 border-t border-dourado-claro pt-4">
        {confirmando ? (
          <button
            type="button"
            onClick={() => excluir.mutate(undefined, { onSuccess: () => void navigate('/painel/viagens') })}
            className="rounded-pill bg-rosa-antigo-escuro px-4 py-1 text-marfim"
          >
            Confirmar exclusão (reservas e gastos espelhados também saem)
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmando(true)} className="text-rosa-antigo-escuro underline">
            Excluir viagem
          </button>
        )}
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
      {dias.length === 0 && <p className="text-grafite-suave">Nenhum item no roteiro.</p>}
      {dias.map((dia) => (
        <div key={dia}>
          <h2 className="text-xl text-salvia-escuro">{formatDataCurta(dia)}</h2>
          <ol className="mt-2 border-l border-dourado pl-4">
            {v.roteiro
              .filter((r) => r.data === dia)
              .map((r) => (
                <li key={r.id} className="mb-3">
                  <span className="font-semibold">{r.horario ?? '—'}</span> {r.titulo}
                  {r.local && <span className="text-grafite-suave"> · {r.local}</span>}
                  <button type="button" aria-label={`Excluir ${r.titulo}`} onClick={() => excluir.mutate(r.id)} className="ml-2 text-sm text-rosa-antigo-escuro underline">
                    excluir
                  </button>
                </li>
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
        className="grid gap-3 rounded-card border border-dourado-claro bg-white p-4 sm:grid-cols-4"
      >
        <label className="block">
          <span className="text-sm text-grafite-suave">Dia</span>
          <input type="date" min={v.dataInicio} max={v.dataFim} value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Horário</span>
          <input type="time" value={d.horario} onChange={(e) => setD({ ...d, horario: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-grafite-suave">O quê</span>
          <input maxLength={120} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} className={inputClass} />
        </label>
        <label className="block sm:col-span-3">
          <span className="text-sm text-grafite-suave">Local</span>
          <input maxLength={200} value={d.local} onChange={(e) => setD({ ...d, local: e.target.value })} className={inputClass} />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={!d.titulo.trim() || salvar.isPending} className="w-full rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim disabled:opacity-60">
            Adicionar
          </button>
        </div>
        {salvar.isError && (
          <p role="alert" className="text-sm text-rosa-antigo-escuro sm:col-span-4">
            {salvar.error instanceof ApiError && salvar.error.code === 'DATA_FORA_DA_VIAGEM' ? 'A data precisa estar dentro da viagem.' : 'Não foi possível salvar.'}
          </p>
        )}
      </form>
    </div>
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
      {v.reservas.length === 0 && <p className="text-grafite-suave">Nenhuma reserva.</p>}
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
        className="grid gap-3 rounded-card border border-dourado-claro bg-white p-4 sm:grid-cols-3"
      >
        <label className="block">
          <span className="text-sm text-grafite-suave">Tipo</span>
          <select value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value as TipoReserva })} className={inputClass}>
            {Object.entries(LABEL_TIPO_RESERVA).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-grafite-suave">Descrição</span>
          <input maxLength={140} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Código</span>
          <input maxLength={80} value={d.codigo} onChange={(e) => setD({ ...d, codigo: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Data</span>
          <input type="date" value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Valor (R$, opcional)</span>
          <input inputMode="decimal" value={d.valor} onChange={(e) => setD({ ...d, valor: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Lançar no financeiro em</span>
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
          <button type="submit" disabled={!d.descricao.trim() || criar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
            Adicionar reserva
          </button>
          {criar.isError && <span role="alert" className="ml-3 text-rosa-antigo-escuro">Não foi possível salvar.</span>}
        </div>
      </form>
    </div>
  );
}

function CartaoReserva({ viagemId, r }: { viagemId: number; r: Reserva }) {
  const atualizar = useEditarViagem(viagemId, (d: object) => api.put<ViagemDetalhe>(`/painel/viagens/${viagemId}/reservas/${r.id}`, d));
  const excluir = useEditarViagem(viagemId, () => api.del<ViagemDetalhe>(`/painel/viagens/${viagemId}/reservas/${r.id}`));
  return (
    <article aria-label={`Reserva ${r.descricao}`} className="rounded-card border border-dourado-claro bg-white p-4 shadow-suave">
      <p className="text-sm tracking-widest text-salvia-escuro uppercase">{LABEL_TIPO_RESERVA[r.tipo]} · {formatDataCurta(r.data)}</p>
      <h3 className="text-xl">{r.descricao}</h3>
      {r.codigo && <p className="mt-1 font-mono text-3xl tracking-wider">{r.codigo}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {r.valorCentavos !== null && <span>{formatarCentavos(r.valorCentavos)}</span>}
        <span className={`rounded-pill px-2 ${r.statusPagamento === 'pago' ? 'bg-salvia-claro' : 'bg-marfim-escuro'}`}>{r.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}</span>
        {r.contratoId !== null && <span className="text-grafite-suave">no financeiro</span>}
        {r.voucherArquivoId && (
          <a href={urlArquivo(r.voucherArquivoId)} target="_blank" rel="noreferrer" className="rounded-pill bg-rosa-antigo-escuro px-3 py-1 text-marfim">
            Abrir voucher
          </a>
        )}
        <button type="button" onClick={() => atualizar.mutate({ statusPagamento: r.statusPagamento === 'pago' ? 'pendente' : 'pago' })} className="underline">
          {r.statusPagamento === 'pago' ? 'Marcar pendente' : 'Marcar pago'}
        </button>
        <button type="button" onClick={() => excluir.mutate(undefined)} className="text-rosa-antigo-escuro underline">
          Excluir
        </button>
      </div>
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
          <li key={dono} className="rounded-card bg-white px-4 py-2 shadow-suave">
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
          <span className="text-sm text-grafite-suave">Item</span>
          <input maxLength={120} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Categoria</span>
          <input maxLength={60} value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} placeholder="Roupas, Praia…" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">De quem</span>
          <select value={d.dono} onChange={(e) => setD({ ...d, dono: e.target.value as Dono })} className={inputClass}>
            {Object.entries(LABEL_DONO).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!d.descricao.trim()} className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim disabled:opacity-60">
          Adicionar
        </button>
      </form>
    </div>
  );
}
