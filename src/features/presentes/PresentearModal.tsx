import { useMutation } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import { centavosParaInput, formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { calcularCobranca, navegador, type Taxas } from './checkout';
import type { Camada, ItemVitrine } from './usePresentes';

const MENSAGENS: Record<string, string> = {
  ITEM_ESGOTADO: 'Este presente acabou de ser escolhido por outra pessoa.',
  VALOR_INVALIDO: 'Confira o valor da cota.',
  CHECKOUT_INDISPONIVEL: 'O pagamento online está indisponível agora. Tente mais tarde.',
  MUITAS_TENTATIVAS: 'Muitas tentativas. Tente em um minuto.',
};

/**
 * Presentear pelo Mercado Pago: valor da cota (fracionável), PIX ou cartão com a taxa
 * somada ao que o convidado paga, nome, e-mail e mensagem.
 */
export function PresentearModal({
  item,
  token,
  nomePadrao,
  taxas,
  onClose,
}: {
  item: ItemVitrine;
  token: Camada;
  nomePadrao?: string;
  taxas: Taxas;
  onClose: () => void;
}) {
  const tituloId = useId();
  const [metodo, setMetodo] = useState<'pix' | 'cartao'>('pix');
  const [valorTexto, setValorTexto] = useState(item.fracionavel ? centavosParaInput(item.cotaMinimaCentavos) : '');
  const [nome, setNome] = useState(nomePadrao ?? '');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');

  const valor = item.fracionavel ? parseCentavos(valorTexto) : item.precoCentavos;
  const valorOk = valor !== null && valor > 0 && (!item.fracionavel || valor >= item.cotaMinimaCentavos);
  const pct = metodo === 'pix' ? taxas.pixPct : taxas.cartaoPct;
  const cobranca = valorOk ? calcularCobranca(valor!, pct) : null;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const iniciar = useMutation({
    mutationFn: () =>
      api.post<{ checkoutUrl: string }>(
        token ? `/convite/${encodeURIComponent(token)}/presentes/${item.id}/checkout` : `/publico/presentes/${item.id}/checkout`,
        {
          doadorNome: nome.trim(),
          doadorEmail: email.trim(),
          mensagem: mensagem.trim(),
          metodo,
          ...(item.fracionavel ? { valorCentavos: valor } : {}),
        },
      ),
    onSuccess: ({ checkoutUrl }) => navegador.ir(checkoutUrl),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valorOk || !emailOk || !nome.trim()) return;
    iniciar.mutate();
  }

  const campo = 'mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-grafite/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && !iniciar.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="max-h-full w-full max-w-md overflow-y-auto rounded-card bg-marfim p-6 shadow-suave">
        <h2 id={tituloId} className="text-2xl">
          Presentear: {item.nome}
        </h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>
          {item.fracionavel ? (
            <label className="block">
              <span className="text-sm text-grafite-suave">Valor da cota (R$), mínimo {formatarCentavos(item.cotaMinimaCentavos)}</span>
              <input inputMode="decimal" value={valorTexto} onChange={(e) => setValorTexto(e.target.value)} className={campo} />
            </label>
          ) : (
            <p>Valor: {formatarCentavos(item.precoCentavos)}</p>
          )}
          <fieldset>
            <legend className="text-sm text-grafite-suave">Forma de pagamento</legend>
            <div className="mt-1 flex gap-3">
              {(
                [
                  ['pix', 'PIX'],
                  ['cartao', 'Cartão'],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className={`flex-1 cursor-pointer rounded-pill border px-4 py-2 text-center ${metodo === v ? 'border-rosa-antigo-escuro bg-rosa-antigo-claro' : 'border-dourado-claro'}`}>
                  <input type="radio" name="metodo" value={v} checked={metodo === v} onChange={() => setMetodo(v)} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          {cobranca && (
            <p aria-label="Resumo do pagamento" className="rounded-card bg-white p-3 text-sm">
              Presente {formatarCentavos(valor!)} + taxa do Mercado Pago {formatarCentavos(cobranca.taxaCentavos)} ={' '}
              <strong>{formatarCentavos(cobranca.cobradoCentavos)}</strong>
            </p>
          )}
          {item.fracionavel && valorTexto !== '' && !valorOk && (
            <p role="alert" className="text-sm text-rosa-antigo-escuro">
              A cota mínima é {formatarCentavos(item.cotaMinimaCentavos)}.
            </p>
          )}
          <label className="block">
            <span className="text-sm text-grafite-suave">Seu nome</span>
            <input maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm text-grafite-suave">Seu e-mail (para o comprovante)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm text-grafite-suave">Mensagem para o casal (opcional)</span>
            <textarea rows={2} maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className={campo} />
          </label>
          {iniciar.isError && (
            <p role="alert" className="text-rosa-antigo-escuro">
              {iniciar.error instanceof ApiError ? (MENSAGENS[iniciar.error.code] ?? 'Não foi possível abrir o pagamento.') : 'Não foi possível abrir o pagamento.'}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-grafite-suave">
              Cancelar
            </button>
            <button type="submit" disabled={!valorOk || !emailOk || !nome.trim() || iniciar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
              {iniciar.isPending ? 'Abrindo…' : 'Ir para o pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
