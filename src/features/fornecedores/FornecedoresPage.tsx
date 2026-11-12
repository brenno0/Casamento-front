import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../lib/api';
import { formatarCentavos } from '../../lib/dinheiro';
import {
  CATEGORIAS_SUGERIDAS,
  STATUS,
  labelStatus,
  useCriarFornecedor,
  useFornecedores,
  type StatusFornecedor,
} from './useFornecedores';

export const inputClass =
  'mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2 text-grafite focus:border-dourado';

const COR_STATUS: Record<StatusFornecedor, string> = {
  pesquisando: 'bg-marfim-escuro text-grafite',
  orcado: 'bg-dourado-claro text-grafite',
  contratado: 'bg-salvia-claro text-grafite',
  descartado: 'bg-white text-grafite-suave line-through',
};

export function BadgeStatus({ status }: { status: StatusFornecedor }) {
  return <span className={`rounded-pill px-3 py-0.5 text-sm ${COR_STATUS[status]}`}>{labelStatus(status)}</span>;
}

export function FornecedoresPage() {
  const [status, setStatus] = useState<StatusFornecedor | ''>('');
  const [categoria, setCategoria] = useState('');
  const [criando, setCriando] = useState(false);
  const { data, isPending, isError } = useFornecedores({
    ...(status ? { status } : {}),
    ...(categoria ? { categoria } : {}),
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Fornecedores</h1>
          <p className="mt-2 text-grafite-suave">Do primeiro contato ao contrato assinado.</p>
        </div>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim"
        >
          Novo fornecedor
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="block">
          <span className="text-sm text-grafite-suave">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFornecedor | '')}
            className={inputClass}
          >
            <option value="">Todos</option>
            {STATUS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Categoria</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
            <option value="">Todas</option>
            {CATEGORIAS_SUGERIDAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isPending && (
        <p role="status" className="mt-6 text-grafite-suave">
          Carregando…
        </p>
      )}
      {isError && !data && (
        <p role="alert" className="mt-6 text-rosa-antigo-escuro">
          Não foi possível carregar os fornecedores.
        </p>
      )}
      {data && data.length === 0 && <p className="mt-6 text-grafite-suave">Nenhum fornecedor por aqui ainda.</p>}
      {data && data.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((f) => (
            <li key={f.id}>
              <Link
                to={`/painel/fornecedores/${f.id}`}
                className="block rounded-card border border-dourado-claro bg-white p-4 shadow-suave transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl">{f.nome}</h2>
                  <BadgeStatus status={f.status} />
                </div>
                <p className="text-sm text-grafite-suave">{f.categoria}</p>
                <p className="mt-2 text-sm">
                  {f.totalOrcamentos === 0
                    ? 'Sem orçamentos'
                    : `${f.totalOrcamentos} orçamento(s) · menor ${formatarCentavos(f.menorOrcamentoCentavos!)}`}
                </p>
                {f.contrato && <p className="mt-1 text-sm text-salvia-escuro">Contrato anexado</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {criando && <NovoFornecedorModal onClose={() => setCriando(false)} />}
    </section>
  );
}

function NovoFornecedorModal({ onClose }: { onClose: () => void }) {
  const tituloId = useId();
  const listaId = useId();
  const navigate = useNavigate();
  const criar = useCriarFornecedor();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim() || !categoria.trim()) return;
    criar.mutate(
      { nome: nome.trim(), categoria: categoria.trim() },
      { onSuccess: (f) => void navigate(`/painel/fornecedores/${f.id}`) },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-grafite/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !criar.isPending) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="w-full max-w-md rounded-card bg-marfim p-6 shadow-suave">
        <h2 id={tituloId} className="text-2xl">
          Novo fornecedor
        </h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <label className="block">
            <span className="text-sm text-grafite-suave">Nome</span>
            <input autoFocus maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-grafite-suave">Categoria</span>
            <input
              list={listaId}
              maxLength={60}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={inputClass}
            />
            <datalist id={listaId}>
              {CATEGORIAS_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          {criar.isError && (
            <p role="alert" className="text-rosa-antigo-escuro">
              {criar.error instanceof ApiError && criar.error.status === 400
                ? 'Confira nome e categoria.'
                : 'Não foi possível criar o fornecedor.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-pill px-4 py-2 text-grafite-suave">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim() || !categoria.trim() || criar.isPending}
              className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
