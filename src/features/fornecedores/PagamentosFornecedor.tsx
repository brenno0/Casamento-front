import { useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import { formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { CartaoContrato } from '../financeiro/FinanceiroPage';
import { totaisDe, useCategorias, useContratos, useCriarContrato, type Categoria } from '../financeiro/useFinanceiro';
import { agoraEmSaoPaulo } from '../roteiro/roteiro';
import { inputClass } from './FornecedoresPage';
import type { FornecedorDetalhe } from './useFornecedores';

/** O que foi combinado com o fornecedor, o que já foi pago e as parcelas que faltam. */
export function PagamentosFornecedor({ f }: { f: FornecedorDetalhe }) {
  const contratos = useContratos();
  const categorias = useCategorias();
  const doFornecedor = (contratos.data ?? []).filter((c) => c.fornecedorId === f.id);
  const t = totaisDe(doFornecedor);

  return (
    <section aria-labelledby="pagamentos-titulo" className="cartao-painel space-y-4">
      <h2 id="pagamentos-titulo" className="text-2xl">
        Pagamentos
      </h2>
      {doFornecedor.length > 0 && (
        <dl className="grid grid-cols-3 gap-4">
          {(
            [
              ['Contratado', t.contratado],
              ['Pago', t.pago],
              ['Falta', t.falta],
            ] as const
          ).map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-sm text-grafite-suave">{rotulo}</dt>
              <dd className={`text-xl font-semibold tabular-nums ${rotulo === 'Falta' && valor > 0 ? 'text-rose-fundo' : ''}`}>
                {formatarCentavos(valor)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {doFornecedor.map((c) => (
        <CartaoContrato key={c.id} c={c} />
      ))}
      {categorias.data && <NovoContratoFornecedor f={f} categorias={categorias.data} />}
    </section>
  );
}

function categoriaPadrao(f: FornecedorDetalhe, categorias: Categoria[]): number {
  const igual = categorias.find((c) => c.nome.toLowerCase() === f.categoria.toLowerCase());
  return igual?.id ?? categorias[0]?.id ?? 0;
}

function NovoContratoFornecedor({ f, categorias }: { f: FornecedorDetalhe; categorias: Categoria[] }) {
  const criar = useCriarContrato();
  const hoje = agoraEmSaoPaulo(new Date()).dia;
  const vazio = { descricao: f.nome, valor: '', entrada: '', pagoEm: hoje, parcelas: '1', primeiro: '' };
  const [d, setD] = useState(vazio);
  const [categoriaId, setCategoriaId] = useState(() => categoriaPadrao(f, categorias));
  const total = parseCentavos(d.valor);
  const entrada = d.entrada.trim() ? parseCentavos(d.entrada) : 0;
  const parcelas = Number(d.parcelas);
  const falta = total !== null && entrada !== null ? total - entrada : null;
  const precisaParcelar = falta !== null && falta > 0;
  const valido =
    d.descricao.trim() !== '' &&
    categoriaId > 0 &&
    total !== null &&
    total > 0 &&
    entrada !== null &&
    entrada <= total &&
    (!entrada || !!d.pagoEm) &&
    (!precisaParcelar || !d.primeiro || (Number.isInteger(parcelas) && parcelas >= 1 && parcelas <= 60));
  const campo = (k: keyof typeof d) => (e: { target: { value: string } }) => {
    criar.reset();
    setD({ ...d, [k]: e.target.value });
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido) return;
    criar.mutate(
      {
        categoriaId,
        fornecedorId: f.id,
        descricao: d.descricao.trim(),
        valorContratadoCentavos: total!,
        ...(entrada ? { entrada: { valorCentavos: entrada, pagoEm: d.pagoEm } } : {}),
        ...(precisaParcelar && d.primeiro ? { restante: { quantidade: parcelas, primeiroVencimento: d.primeiro } } : {}),
      },
      { onSuccess: () => setD(vazio) },
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="Novo contrato do fornecedor" className="grid gap-3 border-t border-linha pt-4 sm:grid-cols-2">
      <h3 className="sm:col-span-2">Novo contrato</h3>
      <label className="block">
        <span className="rotulo">Descrição</span>
        <input maxLength={140} value={d.descricao} onChange={campo('descricao')} className={inputClass} />
      </label>
      <label className="block">
        <span className="rotulo">Categoria do financeiro</span>
        <select value={categoriaId} onChange={(e) => setCategoriaId(Number(e.target.value))} className={inputClass}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="rotulo">Valor total (R$)</span>
        <input inputMode="decimal" value={d.valor} onChange={campo('valor')} className={inputClass} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="rotulo">Já pago (R$)</span>
          <input inputMode="decimal" placeholder="0,00" value={d.entrada} onChange={campo('entrada')} className={inputClass} />
        </label>
        <label className="block">
          <span className="rotulo">Pago em</span>
          <input type="date" value={d.pagoEm} onChange={campo('pagoEm')} className={inputClass} />
        </label>
      </div>
      {precisaParcelar && (
        <>
          <p className="text-sm text-grafite-suave sm:col-span-2">
            Falta {formatarCentavos(falta)}. Para dividir agora, informe as parcelas; dá para fazer depois também.
          </p>
          <label className="block">
            <span className="rotulo">Parcelas</span>
            <input type="number" min={1} max={60} value={d.parcelas} onChange={campo('parcelas')} className={inputClass} />
          </label>
          <label className="block">
            <span className="rotulo">Primeiro vencimento</span>
            <input type="date" value={d.primeiro} onChange={campo('primeiro')} className={inputClass} />
          </label>
        </>
      )}
      {entrada !== null && total !== null && entrada > total && (
        <p role="alert" className="text-sm text-erro sm:col-span-2">
          O valor pago não pode passar do total.
        </p>
      )}
      {criar.isError && (
        <p role="alert" className="text-sm text-erro sm:col-span-2">
          {criar.error instanceof ApiError ? criar.error.message : 'Não foi possível criar o contrato.'}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={!valido || criar.isPending} className="acao">
          Adicionar contrato
        </button>
      </div>
    </form>
  );
}
