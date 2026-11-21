import { useState } from 'react';
import { centavosParaInput, formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { BotaoSegurar } from '../painel/BotaoSegurar';
import { IconePainel } from '../painel/IconePainel';
import { useAtualizarReserva, useCriarReserva, useExcluirReserva, type Reserva } from './useFinanceiro';

/** Quanto cada um tem guardado para o casamento. Os valores salvam ao sair do campo. */
export function Reservas({ reservas, total }: { reservas: Reserva[]; total: number }) {
  const criar = useCriarReserva();
  const [novo, setNovo] = useState('');

  return (
    <section aria-labelledby="reservas" className="cartao-painel space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reservas" className="text-2xl">
          Reservado para o casamento
        </h2>
        <p className="text-sm text-grafite-suave">
          Total <strong className="text-grafite">{formatarCentavos(total)}</strong>
        </p>
      </div>
      <ul className="divide-y divide-linha">
        {reservas.map((r) => (
          <LinhaReserva key={`${r.id}-${r.valorCentavos}-${r.titular}`} r={r} />
        ))}
      </ul>
      <form
        aria-label="Nova reserva"
        onSubmit={(e) => {
          e.preventDefault();
          if (novo.trim()) criar.mutate({ titular: novo.trim() }, { onSuccess: () => setNovo('') });
        }}
        className="flex gap-2"
      >
        <input
          aria-label="Nova reserva"
          placeholder="Outra conta ou pessoa (ex.: Presentes iCasei)"
          maxLength={60}
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          className={`${inputClass} mt-0`}
        />
        <button type="submit" disabled={!novo.trim() || criar.isPending} className="acao-secundaria shrink-0">
          Adicionar
        </button>
      </form>
    </section>
  );
}

function LinhaReserva({ r }: { r: Reserva }) {
  const salvar = useAtualizarReserva();
  const excluir = useExcluirReserva();
  const [valor, setValor] = useState(centavosParaInput(r.valorCentavos));
  const centavos = parseCentavos(valor || '0');

  function salvarValor() {
    if (centavos === null || centavos < 0 || centavos === r.valorCentavos) return;
    salvar.mutate({ id: r.id, valorCentavos: centavos });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <span className="min-w-32 flex-1 font-medium">{r.titular}</span>
      <label className="flex items-center gap-2 text-sm text-grafite-suave">
        R$
        <input
          aria-label={`Reservado por ${r.titular}`}
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvarValor}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={`${inputClass} mt-0 w-36 text-right tabular-nums`}
        />
      </label>
      {r.atualizadoEm && (
        <span className="text-xs text-grafite-suave">atualizado em {new Date(r.atualizadoEm).toLocaleDateString('pt-BR')}</span>
      )}
      <BotaoSegurar aria-label={`Remover reserva de ${r.titular}`} disabled={excluir.isPending} onConfirmar={() => excluir.mutate(r.id)} className="min-h-8 px-2">
        <IconePainel nome="fechar" />
      </BotaoSegurar>
      {(centavos === null || salvar.isError) && (
        <p role="alert" className="w-full text-sm text-erro">
          {centavos === null ? 'Valor inválido.' : 'Não foi possível salvar.'}
        </p>
      )}
    </li>
  );
}
