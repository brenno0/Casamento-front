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
import { IconePainel } from '../painel/IconePainel';

export const inputClass =
  'entrada';

const COR_STATUS: Record<StatusFornecedor, string> = {
  pesquisando: 'bg-nevoa-escuro text-grafite',
  orcado: 'bg-lavanda-claro text-grafite',
  contratado: 'bg-rose-claro text-grafite',
  descartado: 'bg-nevoa text-grafite-suave line-through',
};

export function BadgeStatus({ status }: { status: StatusFornecedor }) {
  return <span className={`selo ${COR_STATUS[status]}`}>{labelStatus(status)}</span>;
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
        <h1 className="text-4xl">Fornecedores</h1>
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="acao"
        >
          <IconePainel nome="mais" />
          Novo fornecedor
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="block">
          <span className="rotulo">Status</span>
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
          <span className="rotulo">Categoria</span>
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
        <p role="alert" className="mt-6 text-erro">
          Não foi possível carregar os fornecedores.
        </p>
      )}
      {data && data.length === 0 && <p className="mt-6 text-grafite-suave">Nenhum fornecedor por aqui ainda.</p>}
      {data && data.length > 0 && (
        <div className="cartao-painel mt-6 overflow-x-auto p-0">
          <table className="tabela">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Categoria</th>
                <th>Status</th>
                <th className="num">Orçamentos</th>
                <th className="num">Menor orçamento</th>
                <th>Contrato</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link to={`/painel/fornecedores/${f.id}`} className="font-semibold text-grafite hover:underline">
                      {f.nome}
                    </Link>
                  </td>
                  <td className="text-grafite-suave">{f.categoria}</td>
                  <td>
                    <BadgeStatus status={f.status} />
                  </td>
                  <td className="num">{f.totalOrcamentos}</td>
                  <td className="num">
                    {f.menorOrcamentoCentavos === null ? '—' : formatarCentavos(f.menorOrcamentoCentavos)}
                  </td>
                  <td className="text-sm text-rose-fundo">{f.contrato ? 'Anexado' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      className="dialogo-fundo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !criar.isPending) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="dialogo max-w-md">
        <h2 id={tituloId} className="titulo-dialogo">
          Novo fornecedor
        </h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <label className="block">
            <span className="rotulo">Nome</span>
            <input autoFocus maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="rotulo">Categoria</span>
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
            <p role="alert" className="text-erro">
              {criar.error instanceof ApiError && criar.error.status === 400
                ? 'Confira nome e categoria.'
                : 'Não foi possível criar o fornecedor.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="acao-discreta">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim() || !categoria.trim() || criar.isPending}
              className="acao"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
