import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { formatDataCurta } from '../../lib/date';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { useCriarViagem, useViagens } from './useViagens';

export function ViagensPage() {
  const { data, isPending, isError } = useViagens();
  const criar = useCriarViagem();
  const navigate = useNavigate();
  const [d, setD] = useState({ nome: '', destino: '', dataInicio: '', dataFim: '' });
  const valido = d.nome.trim() && d.dataInicio && d.dataFim && d.dataFim >= d.dataInicio;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valido) return;
    criar.mutate({ ...d, nome: d.nome.trim(), destino: d.destino.trim() }, { onSuccess: (v) => void navigate(`/painel/viagens/${v.id}`) });
  }

  return (
    <section>
      <h1 className="text-4xl">Viagens</h1>
      {isPending && <p role="status" className="mt-6">Carregando…</p>}
      {isError && <p role="alert" className="mt-6 text-erro">Não foi possível carregar as viagens.</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {data?.map((v) => (
          <li key={v.id}>
            <Link to={`/painel/viagens/${v.id}`} className="block cartao-painel transition-colors hover:border-folha-escuro">
              <h2 className="text-2xl">{v.nome}</h2>
              <p className="text-verde-suave">
                {v.destino && `${v.destino} · `}
                {formatDataCurta(v.dataInicio)} a {formatDataCurta(v.dataFim)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} aria-label="Nova viagem" className="mt-8 grid gap-3 cartao-painel sm:grid-cols-4">
        <h2 className="sm:col-span-4">Nova viagem</h2>
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
        <div className="flex items-end sm:col-span-2">
          <button type="submit" disabled={!valido || criar.isPending} className="acao">
            Criar viagem
          </button>
        </div>
        {d.dataInicio && d.dataFim && d.dataFim < d.dataInicio && (
          <p role="alert" className="text-sm text-erro sm:col-span-4">O fim precisa ser no início ou depois.</p>
        )}
      </form>
    </section>
  );
}
