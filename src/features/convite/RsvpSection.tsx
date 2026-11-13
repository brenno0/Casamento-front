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
  if (isPending) return <p role="status" className="text-center">Carregando…</p>;
  if (isError || !data) {
    return (
      <p role="alert" className="text-center text-rosa-antigo-escuro">
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
      <div className="mx-auto max-w-xl text-center">
        <p role="status" className="text-rosa-antigo-escuro">
          O prazo para confirmar presença terminou em {formatDataExtenso(dados.prazo)}. Se precisar mudar algo, fale com a gente.
        </p>
        <ul className="mt-4 space-y-1">
          {dados.convidados.map((c) => (
            <li key={c.id}>
              {c.nome}: {c.rsvp === 'vai' ? 'vai' : c.rsvp === 'nao_vai' ? 'não vai' : 'sem resposta'}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="Confirmar presença" className="mx-auto max-w-xl space-y-4">
      <p className="text-center text-grafite-suave">Responda até {formatDataExtenso(dados.prazo)}.</p>
      {dados.convidados.map((c) => {
        const esc = escolhas[c.id]!;
        return (
          <fieldset key={c.id} className="rounded-card border border-dourado-claro bg-white p-4">
            <legend className="px-2 text-xl">{c.nome}</legend>
            <div className="flex gap-3">
              {(
                [
                  ['vai', 'Vou'],
                  ['nao_vai', 'Não vou'],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`flex-1 cursor-pointer rounded-pill border px-4 py-2 text-center ${
                    esc.rsvp === v ? 'border-rosa-antigo-escuro bg-rosa-antigo-claro text-rosa-antigo-escuro' : 'border-dourado-claro'
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
              <label className="mt-3 block">
                <span className="text-sm text-grafite-suave">Nome do seu acompanhante (opcional)</span>
                <input
                  maxLength={80}
                  value={esc.acompanhante}
                  onChange={(e) => escolher(c.id, { acompanhante: e.target.value })}
                  className="mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2"
                />
              </label>
            )}
          </fieldset>
        );
      })}
      {enviar.isError && (
        <p role="alert" className="text-center text-rosa-antigo-escuro">
          {enviar.error instanceof ApiError && enviar.error.code === 'RSVP_ENCERRADO'
            ? 'O prazo para confirmar presença terminou.'
            : 'Não foi possível enviar agora. Tente de novo.'}
        </p>
      )}
      {enviado && (
        <p role="status" className="text-center text-salvia-escuro">
          Obrigado! Sua resposta foi registrada. Você pode mudar até o prazo.
        </p>
      )}
      <div className="text-center">
        <button type="submit" disabled={!todos || enviar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-8 py-3 text-marfim disabled:opacity-60">
          {enviar.isPending ? 'Enviando…' : 'Confirmar'}
        </button>
        {!todos && <p className="mt-2 text-sm text-grafite-suave">Marque uma opção para cada pessoa.</p>}
      </div>
    </form>
  );
}
