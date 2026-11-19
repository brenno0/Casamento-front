import { Fragment, useState, type FormEvent } from 'react';
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
      <div role="tablist" aria-label="Seções do financeiro" className="abas mt-6">
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
            className="aba"
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
      <p role="status" className="text-verde-suave">
        Carregando…
      </p>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-erro">
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
    <div className={`cartao-painel ${destaque ?? ''}`}>
      <p className="text-sm text-verde-suave">{titulo}</p>
      <p className="mt-1 font-display text-3xl text-verde">{formatarCentavos(valor)}</p>
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
        <section aria-labelledby="atrasadas" className="rounded-card border border-erro/30 bg-erro/5 p-5">
          <h2 id="atrasadas" className="text-2xl text-erro">
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
          <p className="mt-2 text-verde-suave">Nenhum vencimento nos próximos 30 dias.</p>
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
              <p className="font-medium">{c.nome}</p>
              <dl className="mt-2 grid grid-cols-[6.5rem_1fr_auto] items-center gap-x-3 gap-y-1.5 text-sm">
                {(
                  [
                    ['Previsto', c.previstoCentavos, 'bg-folha-escuro'],
                    ['Contratado', c.contratadoCentavos, 'bg-vela'],
                    ['Pago', c.pagoCentavos, 'bg-verde'],
                  ] as const
                ).map(([rotulo, valor, cor]) => (
                  <Fragment key={rotulo}>
                    <dt className="text-verde-suave">{rotulo}</dt>
                    <dd aria-hidden="true" className="h-2 rounded-botao bg-linho-escuro">
                      <div className={`h-2 rounded-botao ${cor}`} style={{ width: pct(valor) }} />
                    </dd>
                    <dd className="text-right tabular-nums">{formatarCentavos(valor)}</dd>
                  </Fragment>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="entradas" className="cartao-painel border-musgo">
        <h2 id="entradas" className="text-2xl">
          Entradas
        </h2>
        <p className="mt-1">
          Presentes recebidos: <strong>{formatarCentavos(d.presentesRecebidosCentavos)}</strong>
        </p>
        <p className="text-sm text-verde-suave">Entram à parte e não abatem os custos acima.</p>
      </section>
    </div>
  );
}

function ListaParcelas({ itens }: { itens: ParcelaResumo[] }) {
  return (
    <ul className="mt-2 divide-y divide-folha">
      {itens.map((p) => (
        <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
          <span>
            {formatDataCurta(p.vencimento)} · {p.contratoDescricao}{' '}
            <span className="rotulo">({p.categoriaNome})</span>
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
          <span className="rotulo">Nova categoria</span>
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
        <button type="submit" disabled={!nome.trim() || criar.isPending} className="acao">
          Adicionar
        </button>
        {criar.isError && (
          <p role="alert" className="text-erro">
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
    <li className="flex flex-wrap items-end gap-3 cartao-painel p-3">
      <span className="min-w-40 flex-1">{c.nome}</span>
      <label className="block">
        <span className="rotulo">Previsto (R$) de {c.nome}</span>
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
        className="acao"
      >
        Salvar
      </button>
      <button
        type="button"
        aria-label={`Excluir categoria ${c.nome}`}
        onClick={() => excluir.mutate(c.id)}
        className="px-2 py-2 text-sm acao-link"
      >
        Excluir
      </button>
      {valor === null && previsto !== '' && (
        <p role="alert" className="w-full text-sm text-erro">
          Valor inválido.
        </p>
      )}
      {excluir.isError && (
        <p role="alert" className="w-full text-sm text-erro">
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
      {contratos.data.length === 0 && <p className="text-verde-suave">Nenhum contrato ainda.</p>}
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
    <form onSubmit={onSubmit} aria-label="Novo contrato" className="grid gap-3 cartao-painel sm:grid-cols-5">
      <label className="block sm:col-span-2">
        <span className="rotulo">Descrição</span>
        <input maxLength={140} value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Categoria</span>
        <select value={categoriaId} onChange={(e) => setCategoriaId(Number(e.target.value))} className={inputClass}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="rotulo">Fornecedor</span>
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
        <span className="rotulo">Valor contratado (R$)</span>
        <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} />
      </label>
      <div className="sm:col-span-5">
        <button type="submit" disabled={!valido || criar.isPending} className="acao">
          Adicionar contrato
        </button>
        {criar.isError && (
          <span role="alert" className="ml-3 text-erro">
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
    <article aria-label={`Contrato ${c.descricao}`} className="cartao-painel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl">{c.descricao}</h2>
          <p className="text-sm text-verde-suave">
            {c.categoriaNome}
            {c.fornecedorNome ? ` · ${c.fornecedorNome}` : ''}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>Contratado {formatarCentavos(c.valorContratadoCentavos)}</p>
          <p className="text-musgo">Pago {formatarCentavos(c.pagoCentavos)}</p>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-folha">
        {c.parcelas.map((p) => (
          <LinhaParcela key={p.id} p={p} />
        ))}
      </ul>

      {restante > 0 && (
        <form onSubmit={onGerar} className="mt-3 flex flex-wrap items-end gap-2" aria-label={`Gerar parcelas de ${c.descricao}`}>
          <p className="w-full text-sm text-verde-suave">Falta parcelar {formatarCentavos(restante)}.</p>
          <label className="block">
            <span className="rotulo">Parcelas</span>
            <input type="number" min={1} max={60} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="rotulo">Primeiro vencimento</span>
            <input type="date" value={primeiro} onChange={(e) => setPrimeiro(e.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={!primeiro || gerar.isPending} className="acao">
            Gerar parcelas
          </button>
          {gerar.isError && (
            <p role="alert" className="w-full text-sm text-erro">
              Não foi possível gerar as parcelas.
            </p>
          )}
        </form>
      )}
      <button type="button" onClick={() => excluir.mutate(c.id)} className="mt-3 text-sm acao-perigo">
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
        <span className={p.atrasada ? 'text-erro' : ''}>{formatDataCurta(p.vencimento)}</span>
        <strong>{formatarCentavos(p.valorCentavos)}</strong>
        {p.status === 'pago' ? (
          <span className="rounded-botao bg-folha-claro px-2 text-sm">Pago em {formatDataCurta(p.pagoEm!)}</span>
        ) : p.atrasada ? (
          <span className="selo bg-erro/10 text-erro">Atrasada</span>
        ) : (
          <span className="selo bg-linho-escuro text-verde-suave">Pendente</span>
        )}
        {p.comprovanteArquivoId && (
          <a href={urlArquivo(p.comprovanteArquivoId)} target="_blank" rel="noreferrer" className="text-sm underline">
            comprovante
          </a>
        )}
        {p.status === 'pendente' ? (
          <button type="button" onClick={() => setPagando(true)} className="text-sm acao-link">
            Registrar pagamento
          </button>
        ) : (
          <button type="button" onClick={() => desfazer.mutate(p.id)} className="text-sm acao-link text-verde-suave">
            Desfazer pagamento
          </button>
        )}
        <button type="button" aria-label="Excluir parcela" onClick={() => excluir.mutate(p.id)} className="text-sm acao-link text-verde-suave">
          Excluir
        </button>
      </div>
      {pagando && p.status === 'pendente' && (
        <div className="mt-2 flex flex-wrap items-end gap-3 rounded-card bg-linho p-3">
          <label className="block">
            <span className="rotulo">Pago em</span>
            <input type="date" value={pagoEm} onChange={(e) => setPagoEm(e.target.value)} className={inputClass} />
          </label>
          <FileUpload label="Comprovante (opcional)" onEnviado={(a) => setComprovante(a.id)} />
          <button
            type="button"
            disabled={!pagoEm || pagar.isPending}
            onClick={() =>
              pagar.mutate({ id: p.id, pagoEm, comprovanteArquivoId: comprovante }, { onSuccess: () => setPagando(false) })
            }
            className="acao"
          >
            Confirmar pagamento
          </button>
          {pagar.isError && (
            <p role="alert" className="w-full text-sm text-erro">
              Não foi possível registrar o pagamento.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
