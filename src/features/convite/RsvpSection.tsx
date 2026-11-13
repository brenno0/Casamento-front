import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import { formatDataExtenso } from '../../lib/date';

interface Pessoa {
  id: number;
  nome: string;
  tipo: 'adulto' | 'crianca';
  rsvp: 'sem_resposta' | 'vai' | 'nao_vai';
  acompanhantePermitido: boolean;
  acompanhanteNome: string | null;
}

export interface RsvpGrupo {
  grupo: { nome: string; mensagem: string | null };
  prazo: string;
  bloqueado: boolean;
  convidados: Pessoa[];
}

const rsvpQueryKey = (token: string) => ['convite', token, 'rsvp'] as const;

type Escolha = { rsvp: 'vai' | 'nao_vai' | ''; acompanhante: string };

export function RsvpSection({ token }: { token: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: rsvpQueryKey(token),
    queryFn: () => api.get<RsvpGrupo>(`/convite/${encodeURIComponent(token)}/rsvp`),
  });
  if (isPending) return <p role="status" className="text-verde-suave">Carregando…</p>;
  if (isError || !data) {
    return (
      <p role="alert" className="text-erro">
        Não foi possível carregar a confirmação de presença.
      </p>
    );
  }
  return <Formulario token={token} dados={data} />;
}

function Formulario({ token, dados }: { token: string; dados: RsvpGrupo }) {
  const queryClient = useQueryClient();
  const [escolhas, setEscolhas] = useState<Record<number, Escolha>>(() =>
    Object.fromEntries(
      dados.convidados.map((c) => [c.id, { rsvp: c.rsvp === 'sem_resposta' ? '' : c.rsvp, acompanhante: c.acompanhanteNome ?? '' }]),
    ),
  );
  const [enviado, setEnviado] = useState(false);
  const enviar = useMutation({
    mutationFn: (respostas: object[]) => api.put<RsvpGrupo>(`/convite/${encodeURIComponent(token)}/rsvp`, { respostas }),
    onSuccess: (novo) => {
      setEnviado(true);
      queryClient.setQueryData(rsvpQueryKey(token), novo);
    },
  });
  const todos = dados.convidados.every((c) => escolhas[c.id]?.rsvp);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!todos) return;
    enviar.mutate(
      dados.convidados.map((c) => {
        const esc = escolhas[c.id]!;
        return {
          convidadoId: c.id,
          rsvp: esc.rsvp,
          ...(c.acompanhantePermitido && esc.rsvp === 'vai' ? { acompanhanteNome: esc.acompanhante.trim() || null } : {}),
        };
      }),
    );
  }

  const escolher = (id: number, parcial: Partial<Escolha>) => {
    setEnviado(false);
    enviar.reset();
    setEscolhas((e) => ({ ...e, [id]: { ...e[id]!, ...parcial } }));
  };

  if (dados.bloqueado) {
    return (
      <div className="max-w-xl">
        <p role="status" className="text-lg text-verde">
          O prazo para confirmar presença terminou em {formatDataExtenso(dados.prazo)}. Se precisar mudar algo, fale com a gente.
        </p>
        <ul className="mt-8 border-t border-folha-escuro">
          {dados.convidados.map((c) => (
            <li key={c.id} className="border-b border-folha-escuro py-4">
              {c.nome}: {c.rsvp === 'vai' ? 'vai' : c.rsvp === 'nao_vai' ? 'não vai' : 'sem resposta'}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="Confirmar presença" className="max-w-2xl">
      <p className="text-lg text-verde-suave">Responda até {formatDataExtenso(dados.prazo)}.</p>
      <div className="mt-8 border-t border-folha-escuro">
        {dados.convidados.map((c) => {
          const esc = escolhas[c.id]!;
          return (
            <fieldset key={c.id} className="border-b border-folha-escuro py-8">
              <legend className="float-left w-full font-caslon text-2xl text-verde">{c.nome}</legend>
              <div className="clear-both grid grid-cols-2 gap-3 pt-5 sm:max-w-sm">
                {(
                  [
                    ['vai', 'Vou'],
                    ['nao_vai', 'Não vou'],
                  ] as const
                ).map(([v, label]) => (
                  <label
                    key={v}
                    className={`flex min-h-12 cursor-pointer items-center justify-center rounded-botao border px-4 py-3 font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde ${
                      esc.rsvp === v ? 'border-verde bg-verde text-linho' : 'border-folha-escuro text-verde hover:border-verde'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`rsvp-${c.id}`}
                      value={v}
                      checked={esc.rsvp === v}
                      onChange={() => escolher(c.id, { rsvp: v })}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {c.acompanhantePermitido && esc.rsvp === 'vai' && (
                <label className="mt-6 block sm:max-w-sm">
                  <span className="text-sm font-medium text-verde-suave">Nome do seu acompanhante (opcional)</span>
                  <input maxLength={80} value={esc.acompanhante} onChange={(e) => escolher(c.id, { acompanhante: e.target.value })} className="campo" />
                </label>
              )}
            </fieldset>
          );
        })}
      </div>
      {enviar.isError && (
        <p role="alert" className="mt-6 text-erro">
          {enviar.error instanceof ApiError && enviar.error.code === 'RSVP_ENCERRADO'
            ? 'O prazo para confirmar presença terminou.'
            : 'Não foi possível enviar agora. Tente de novo.'}
        </p>
      )}
      {enviado && (
        <p role="status" className="mt-6 bg-vela-claro px-5 py-4 text-verde">
          Obrigado! Sua resposta foi registrada. Você pode mudar até o prazo.
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" disabled={!todos || enviar.isPending} className="botao px-10">
          {enviar.isPending ? 'Enviando…' : 'Confirmar'}
        </button>
        {!todos && <p className="text-sm text-verde-suave">Marque uma opção para cada pessoa.</p>}
      </div>
    </form>
  );
}
