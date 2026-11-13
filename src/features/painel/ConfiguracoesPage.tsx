import { useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import type { CasalPublico } from '../site/useCasal';
import { useAtualizarCasal, useCasalPainel } from './useCasalPainel';

const NOME_MAX = 80;

const inputClass =
  'mt-1 block w-full rounded-card border border-folha bg-white px-4 py-2 text-tinta focus:border-folha-escuro';

export function ConfiguracoesPage() {
  const { data, isPending, isError } = useCasalPainel();
  // A mutação vive aqui para o "Salvo." sobreviver ao remount do formulário com os dados novos.
  const atualizar = useAtualizarCasal();

  return (
    <section>
      <h1 className="text-4xl">Configurações</h1>
      <p className="mt-3 text-verde-suave">Nomes do casal exibidos no site e no painel.</p>

      {isPending && (
        <p className="mt-6 text-verde-suave" role="status">
          Carregando…
        </p>
      )}
      {isError && !data && (
        <p className="mt-6 text-erro" role="alert">
          Não foi possível carregar as configurações.
        </p>
      )}
      {/* `key` ressincroniza o formulário quando os dados carregados mudam. */}
      {data && (
        <NomesForm
          key={JSON.stringify([data.nomeNoiva, data.nomeNoivo])}
          casal={data}
          atualizar={atualizar}
        />
      )}
    </section>
  );
}

function NomesForm({
  casal,
  atualizar,
}: {
  casal: CasalPublico;
  atualizar: ReturnType<typeof useAtualizarCasal>;
}) {
  const [nomeNoiva, setNomeNoiva] = useState(casal.nomeNoiva);
  const [nomeNoivo, setNomeNoivo] = useState(casal.nomeNoivo);

  const invalido = nomeNoiva.trim() === '' || nomeNoivo.trim() === '';

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalido) return;
    atualizar.mutate({ nomeNoiva: nomeNoiva.trim(), nomeNoivo: nomeNoivo.trim() });
  }

  return (
    <form className="mt-6 max-w-md space-y-4" onSubmit={onSubmit} noValidate>
      <label className="block">
        <span className="text-sm text-verde-suave">Nome da noiva</span>
        <input
          name="nomeNoiva"
          required
          maxLength={NOME_MAX}
          value={nomeNoiva}
          onChange={(e) => {
            setNomeNoiva(e.target.value);
            atualizar.reset();
          }}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm text-verde-suave">Nome do noivo</span>
        <input
          name="nomeNoivo"
          required
          maxLength={NOME_MAX}
          value={nomeNoivo}
          onChange={(e) => {
            setNomeNoivo(e.target.value);
            atualizar.reset();
          }}
          className={inputClass}
        />
      </label>

      {invalido && (
        <p className="text-erro" role="alert">
          Os dois nomes são obrigatórios.
        </p>
      )}
      {atualizar.isError && (
        <p className="text-erro" role="alert">
          {atualizar.error instanceof ApiError && atualizar.error.status === 400
            ? 'Confira os nomes (até 80 caracteres).'
            : 'Não foi possível salvar agora. Tente novamente.'}
        </p>
      )}
      {atualizar.isSuccess && (
        <p className="text-musgo" role="status">
          Salvo.
        </p>
      )}

      <button
        type="submit"
        disabled={invalido || atualizar.isPending}
        className="rounded-botao bg-verde px-6 py-2 text-linho transition-opacity disabled:opacity-60"
      >
        {atualizar.isPending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  );
}
