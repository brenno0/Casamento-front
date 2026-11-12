import { useState, type FormEvent } from 'react';
import { FileUpload } from '../../components/FileUpload';
import { ApiError } from '../../lib/api';
import { formatDataCurta } from '../../lib/date';
import { centavosParaInput, formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { urlArquivo } from '../../lib/upload';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { useFornecedores } from '../fornecedores/useFornecedores';
import {
  useAtualizarCategoria,
  useCategorias,
  useContratos,
  useCriarCategoria,
  useCriarContrato,
  useDashboard,
  useDesfazerPagamento,
  useExcluirCategoria,
  useExcluirContrato,
  useExcluirParcela,
  useGerarParcelas,
  usePagarParcela,
  type Categoria,
  type Contrato,
  type Dashboard,
  type Parcela,
  type ParcelaResumo,
} from './useFinanceiro';

type Aba = 'resumo' | 'categorias' | 'contratos';

export function FinanceiroPage() {
  const [aba, setAba] = useState<Aba>('resumo');
  return (
    <section>
      <h1 className="text-4xl">Financeiro</h1>
      <p className="mt-2 text-grafite-suave">Só o dinheiro de vocês: previsto, contratado e pago.</p>
      <div role="tablist" aria-label="Seções do financeiro" className="mt-6 flex gap-2">
        {(
          [
            ['resumo', 'Resumo'],
            ['categorias', 'Categorias'],
            ['contratos', 'Contratos e parcelas'],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            role="tab"
            type="button"
            aria-selected={aba === valor}
            onClick={() => setAba(valor)}
            className={`rounded-pill border px-4 py-1 ${
              aba === valor
                ? 'border-rosa-antigo-escuro bg-rosa-antigo-claro text-rosa-antigo-escuro'
                : 'border-dourado-claro text-grafite-suave'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {aba === 'resumo' && <Resumo />}
        {aba === 'categorias' && <Categorias />}
        {aba === 'contratos' && <Contratos />}
      </div>
    </section>
  );
}

function Carregando({ isPending, isError, oque }: { isPending: boolean; isError: boolean; oque: string }) {
  if (isPending) {
    return (
      <p role="status" className="text-grafite-suave">
        Carregando…
      </p>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-rosa-antigo-escuro">
        Não foi possível carregar {oque}.
      </p>
    );
  }
  return null;
}

function Resumo() {
  const { data, isPending, isError } = useDashboard();
  if (!data) return <Carregando isPending={isPending} isError={isError} oque="o resumo" />;
  return <ResumoConteudo d={data} />;
}

function Cartao({ titulo, valor, destaque }: { titulo: string; valor: number; destaque?: string }) {
  return (
    <div className={`rounded-card border border-dourado-claro bg-white p-4 shadow-suave ${destaque ?? ''}`}>
      <p className="text-sm text-grafite-suave">{titulo}</p>
      <p className="mt-1 text-2xl">{formatarCentavos(valor)}</p>
    </div>
  );
}

function ResumoConteudo({ d }: { d: Dashboard }) {
  const maior = Math.max(1, ...d.categorias.flatMap((c) => [c.previstoCentavos, c.contratadoCentavos, c.pagoCentavos]));
  const pct = (v: number) => `${Math.round((v / maior) * 100)}%`;
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3" aria-label="Totais">
        <Cartao titulo="Previsto" valor={d.totais.previstoCentavos} />
        <Cartao titulo="Contratado" valor={d.totais.contratadoCentavos} />
        <Cartao titulo="Pago" valor={d.totais.pagoCentavos} />
      </div>

      {d.atrasadas.length > 0 && (
        <section aria-labelledby="atrasadas" className="rounded-card border border-rosa-antigo-escuro bg-rosa-antigo-claro p-4">
          <h2 id="atrasadas" className="text-2xl text-rosa-antigo-escuro">
            Parcelas atrasadas
          </h2>
          <ListaParcelas itens={d.atrasadas} />
        </section>
      )}

      <section aria-labelledby="proximos">
        <h2 id="proximos" className="text-2xl">
          Próximos 30 dias
        </h2>
        {d.proximosVencimentos.length === 0 ? (
          <p className="mt-2 text-grafite-suave">Nenhum vencimento nos próximos 30 dias.</p>
        ) : (
          <ListaParcelas itens={d.proximosVencimentos} />
        )}
      </section>

      <section aria-labelledby="por-categoria">
        <h2 id="por-categoria" className="text-2xl">
          Por categoria
        </h2>
        <ul className="mt-3 space-y-4">
          {d.categorias.map((c) => (
            <li key={c.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <span>{c.nome}</span>
                <span className="text-sm text-grafite-suave">
                  previsto {formatarCentavos(c.previstoCentavos)} · contratado {formatarCentavos(c.contratadoCentavos)} · pago{' '}
                  {formatarCentavos(c.pagoCentavos)}
                </span>
              </div>
              <div className="mt-1 space-y-1" aria-hidden="true">
                <div className="h-1.5 rounded-pill bg-dourado-claro" style={{ width: pct(c.previstoCentavos) }} />
                <div className="h-1.5 rounded-pill bg-rosa-antigo" style={{ width: pct(c.contratadoCentavos) }} />
                <div className="h-1.5 rounded-pill bg-salvia-escuro" style={{ width: pct(c.pagoCentavos) }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-grafite-suave">Barras: previsto (dourado), contratado (rosa), pago (verde).</p>
      </section>

      <section aria-labelledby="entradas" className="rounded-card border border-salvia bg-white p-4">
        <h2 id="entradas" className="text-2xl">
          Entradas
        </h2>
        <p className="mt-1">
          Presentes recebidos: <strong>{formatarCentavos(d.presentesRecebidosCentavos)}</strong>
        </p>
        <p className="text-sm text-grafite-suave">Entram à parte e não abatem os custos acima.</p>
      </section>
    </div>
  );
}

function ListaParcelas({ itens }: { itens: ParcelaResumo[] }) {
  return (
    <ul className="mt-2 divide-y divide-dourado-claro">
      {itens.map((p) => (
        <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
          <span>
            {formatDataCurta(p.vencimento)} · {p.contratoDescricao}{' '}
            <span className="text-sm text-grafite-suave">({p.categoriaNome})</span>
          </span>
          <strong>{formatarCentavos(p.valorCentavos)}</strong>
        </li>
      ))}
    </ul>
  );
}

// ---------- categorias ----------

function Categorias() {
  const { data, isPending, isError } = useCategorias();
  const criar = useCriarCategoria();
  const [nome, setNome] = useState('');

  if (!data) return <Carregando isPending={isPending} isError={isError} oque="as categorias" />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;
    criar.mutate({ nome: nome.trim() }, { onSuccess: () => setNome('') });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {data.map((c) => (
          <LinhaCategoria key={`${c.id}-${c.previstoCentavos}-${c.nome}`} c={c} />
        ))}
      </ul>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2" aria-label="Nova categoria">
        <label className="block">
          <span className="text-sm text-grafite-suave">Nova categoria</span>
          <input
            maxLength={60}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              criar.reset();
            }}
            className={inputClass}
          />
        </label>
        <button type="submit" disabled={!nome.trim() || criar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim disabled:opacity-60">
          Adicionar
        </button>
        {criar.isError && (
          <p role="alert" className="text-rosa-antigo-escuro">
            {criar.error instanceof ApiError && criar.error.code === 'CATEGORIA_DUPLICADA'
              ? 'Já existe uma categoria com esse nome.'
              : 'Não foi possível criar a categoria.'}
          </p>
        )}
      </form>
    </div>
  );
}

function LinhaCategoria({ c }: { c: Categoria }) {
  const atualizar = useAtualizarCategoria();
  const excluir = useExcluirCategoria();
  const [previsto, setPrevisto] = useState(centavosParaInput(c.previstoCentavos));
  const valor = parseCentavos(previsto);

  return (
    <li className="flex flex-wrap items-end gap-3 rounded-card border border-dourado-claro bg-white p-3">
      <span className="min-w-40 flex-1">{c.nome}</span>
      <label className="block">
        <span className="text-sm text-grafite-suave">Previsto (R$) de {c.nome}</span>
        <input
          inputMode="decimal"
          value={previsto}
          onChange={(e) => {
            setPrevisto(e.target.value);
            atualizar.reset();
          }}
          className={inputClass}
        />
      </label>
      <button
        type="button"
        disabled={valor === null || valor === c.previstoCentavos || atualizar.isPending}
        onClick={() => valor !== null && atualizar.mutate({ id: c.id, previstoCentavos: valor })}
        className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim disabled:opacity-60"
      >
        Salvar
      </button>
      <button
        type="button"
        aria-label={`Excluir categoria ${c.nome}`}
        onClick={() => excluir.mutate(c.id)}
        className="px-2 py-2 text-sm text-rosa-antigo-escuro underline"
      >
        Excluir
      </button>
      {valor === null && previsto !== '' && (
        <p role="alert" className="w-full text-sm text-rosa-antigo-escuro">
          Valor inválido.
        </p>
      )}
      {excluir.isError && (
        <p role="alert" className="w-full text-sm text-rosa-antigo-escuro">
          {excluir.error instanceof ApiError && excluir.error.code === 'CATEGORIA_EM_USO'
            ? 'Há contratos nesta categoria.'
            : 'Não foi possível excluir.'}
        </p>
      )}
    </li>
  );
}

// ---------- contratos ----------

function Contratos() {
  const contratos = useContratos();
  const categorias = useCategorias();
  if (!contratos.data || !categorias.data) {
    return (
      <Carregando
        isPending={contratos.isPending || categorias.isPending}
        isError={contratos.isError || categorias.isError}
        oque="os contratos"
      />
    );
  }
  return (
    <div className="space-y-6">
      <NovoContrato categorias={categorias.data} />
      {contratos.data.length === 0 && <p className="text-grafite-suave">Nenhum contrato ainda.</p>}
      {contratos.data.map((c) => (
        <CartaoContrato key={c.id} c={c} />
      ))}
    </div>
  );
}

function NovoContrato({ categorias }: { categorias: Categoria[] }) {
  const criar = useCriarContrato();
  const fornecedores = useFornecedores();
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? 0);
  const [fornecedorId, setFornecedorId] = useState<number | null>(null);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const centavos = parseCentavos(valor);
  const valido = descricao.trim() !== '' && centavos !== null && centavos > 0 && categoriaId > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido) return;
    criar.mutate(
      { categoriaId, fornecedorId, descricao: descricao.trim(), valorContratadoCentavos: centavos! },
      {
        onSuccess: () => {
          setDescricao('');
          setValor('');
          setFornecedorId(null);
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="Novo contrato" className="grid gap-3 rounded-card border border-dourado-claro bg-white p-4 sm:grid-cols-5">
      <label className="block sm:col-span-2">
        <span className="text-sm text-grafite-suave">Descrição</span>
        <input maxLength={140} value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-grafite-suave">Categoria</span>
        <select value={categoriaId} onChange={(e) => setCategoriaId(Number(e.target.value))} className={inputClass}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm text-grafite-suave">Fornecedor</span>
        <select
          value={fornecedorId ?? ''}
          onChange={(e) => setFornecedorId(e.target.value === '' ? null : Number(e.target.value))}
          className={inputClass}
        >
          <option value="">Nenhum</option>
          {(fornecedores.data ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm text-grafite-suave">Valor contratado (R$)</span>
        <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} />
      </label>
      <div className="sm:col-span-5">
        <button type="submit" disabled={!valido || criar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
          Adicionar contrato
        </button>
        {criar.isError && (
          <span role="alert" className="ml-3 text-rosa-antigo-escuro">
            Não foi possível criar o contrato.
          </span>
        )}
      </div>
    </form>
  );
}

function CartaoContrato({ c }: { c: Contrato }) {
  const gerar = useGerarParcelas();
  const excluir = useExcluirContrato();
  const [quantidade, setQuantidade] = useState('1');
  const [primeiro, setPrimeiro] = useState('');
  const restante = c.valorContratadoCentavos - c.parceladoCentavos;

  function onGerar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = Number(quantidade);
    if (!primeiro || !Number.isInteger(q) || q < 1 || restante <= 0) return;
    gerar.mutate({ contratoId: c.id, quantidade: q, primeiroVencimento: primeiro, valorTotalCentavos: restante });
  }

  return (
    <article aria-label={`Contrato ${c.descricao}`} className="rounded-card border border-dourado-claro bg-white p-4 shadow-suave">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl">{c.descricao}</h2>
          <p className="text-sm text-grafite-suave">
            {c.categoriaNome}
            {c.fornecedorNome ? ` · ${c.fornecedorNome}` : ''}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>Contratado {formatarCentavos(c.valorContratadoCentavos)}</p>
          <p className="text-salvia-escuro">Pago {formatarCentavos(c.pagoCentavos)}</p>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-dourado-claro">
        {c.parcelas.map((p) => (
          <LinhaParcela key={p.id} p={p} />
        ))}
      </ul>

      {restante > 0 && (
        <form onSubmit={onGerar} className="mt-3 flex flex-wrap items-end gap-2" aria-label={`Gerar parcelas de ${c.descricao}`}>
          <p className="w-full text-sm text-grafite-suave">Falta parcelar {formatarCentavos(restante)}.</p>
          <label className="block">
            <span className="text-sm text-grafite-suave">Parcelas</span>
            <input type="number" min={1} max={60} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-grafite-suave">Primeiro vencimento</span>
            <input type="date" value={primeiro} onChange={(e) => setPrimeiro(e.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={!primeiro || gerar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim disabled:opacity-60">
            Gerar parcelas
          </button>
          {gerar.isError && (
            <p role="alert" className="w-full text-sm text-rosa-antigo-escuro">
              Não foi possível gerar as parcelas.
            </p>
          )}
        </form>
      )}
      <button type="button" onClick={() => excluir.mutate(c.id)} className="mt-3 text-sm text-rosa-antigo-escuro underline">
        Excluir contrato
      </button>
    </article>
  );
}

function LinhaParcela({ p }: { p: Parcela }) {
  const pagar = usePagarParcela();
  const desfazer = useDesfazerPagamento();
  const excluir = useExcluirParcela();
  const [pagando, setPagando] = useState(false);
  const [pagoEm, setPagoEm] = useState('');
  const [comprovante, setComprovante] = useState<number | null>(null);

  return (
    <li className="py-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className={p.atrasada ? 'text-rosa-antigo-escuro' : ''}>{formatDataCurta(p.vencimento)}</span>
        <strong>{formatarCentavos(p.valorCentavos)}</strong>
        {p.status === 'pago' ? (
          <span className="rounded-pill bg-salvia-claro px-2 text-sm">Pago em {formatDataCurta(p.pagoEm!)}</span>
        ) : p.atrasada ? (
          <span className="rounded-pill bg-rosa-antigo-escuro px-2 text-sm text-marfim">Atrasada</span>
        ) : (
          <span className="rounded-pill bg-marfim-escuro px-2 text-sm">Pendente</span>
        )}
        {p.comprovanteArquivoId && (
          <a href={urlArquivo(p.comprovanteArquivoId)} target="_blank" rel="noreferrer" className="text-sm underline">
            comprovante
          </a>
        )}
        {p.status === 'pendente' ? (
          <button type="button" onClick={() => setPagando(true)} className="text-sm text-rosa-antigo-escuro underline">
            Registrar pagamento
          </button>
        ) : (
          <button type="button" onClick={() => desfazer.mutate(p.id)} className="text-sm text-grafite-suave underline">
            Desfazer pagamento
          </button>
        )}
        <button type="button" aria-label="Excluir parcela" onClick={() => excluir.mutate(p.id)} className="text-sm text-grafite-suave underline">
          Excluir
        </button>
      </div>
      {pagando && p.status === 'pendente' && (
        <div className="mt-2 flex flex-wrap items-end gap-3 rounded-card bg-marfim p-3">
          <label className="block">
            <span className="text-sm text-grafite-suave">Pago em</span>
            <input type="date" value={pagoEm} onChange={(e) => setPagoEm(e.target.value)} className={inputClass} />
          </label>
          <FileUpload label="Comprovante (opcional)" onEnviado={(a) => setComprovante(a.id)} />
          <button
            type="button"
            disabled={!pagoEm || pagar.isPending}
            onClick={() =>
              pagar.mutate({ id: p.id, pagoEm, comprovanteArquivoId: comprovante }, { onSuccess: () => setPagando(false) })
            }
            className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim disabled:opacity-60"
          >
            Confirmar pagamento
          </button>
          {pagar.isError && (
            <p role="alert" className="w-full text-sm text-rosa-antigo-escuro">
              Não foi possível registrar o pagamento.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
