import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { formatDataCurta } from '../../lib/date';
import { CONVIDADOS_QUERY_KEY } from './useConvidados';

interface StatusLgpd {
  limpoEm: string | null;
  automaticaEm: string;
}

const LGPD_KEY = [...CONVIDADOS_QUERY_KEY, 'lgpd'] as const;

/** Apagar telefones e e-mails dos convidados depois do casamento (LGPD). */
export function CartaoLgpd() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: LGPD_KEY, queryFn: () => api.get<StatusLgpd>('/painel/convidados/lgpd') });
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const limpar = useMutation({
    mutationFn: () => api.post<StatusLgpd>('/painel/convidados/limpeza-lgpd', { confirmacao: 'APAGAR' }),
    onSuccess: (s) => {
      queryClient.setQueryData(LGPD_KEY, s);
      void queryClient.invalidateQueries({ queryKey: CONVIDADOS_QUERY_KEY });
      setAberto(false);
    },
  });
  if (!data) return null;

  return (
    <section aria-labelledby="lgpd-titulo" className="mt-10 rounded-card border border-folha bg-white p-4">
      <h2 id="lgpd-titulo" className="text-xl">
        Privacidade dos convidados (LGPD)
      </h2>
      {data.limpoEm ? (
        <p className="mt-1 text-musgo">
          Telefones e e-mails apagados em {new Date(data.limpoEm).toLocaleDateString('pt-BR')}. O registro de presentes foi mantido.
        </p>
      ) : (
        <>
          <p className="mt-1 text-verde-suave">
            Telefones e e-mails dos convidados serão apagados automaticamente em {formatDataCurta(data.automaticaEm)}. Vocês podem
            apagar antes, depois do casamento. O registro de presentes é mantido.
          </p>
          {aberto ? (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="text-sm text-verde-suave">Digite APAGAR para confirmar</span>
                <input value={texto} onChange={(e) => setTexto(e.target.value)} className="mt-1 block rounded-card border border-folha px-3 py-2" />
              </label>
              <button type="button" disabled={texto !== 'APAGAR' || limpar.isPending} onClick={() => limpar.mutate()} className="rounded-botao bg-verde px-4 py-2 text-linho disabled:opacity-60">
                Apagar contatos agora
              </button>
              <button type="button" onClick={() => setAberto(false)} className="px-3 py-2 text-verde-suave">
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setAberto(true)} className="mt-3 text-sm text-verde underline">
              Apagar contatos agora…
            </button>
          )}
          {limpar.isError && (
            <p role="alert" className="mt-2 text-sm text-erro">
              {limpar.error instanceof ApiError && limpar.error.code === 'LIMPEZA_ANTES_DO_CASAMENTO'
                ? 'Só é possível apagar depois do casamento.'
                : 'Não foi possível apagar agora.'}
            </p>
          )}
        </>
      )}
    </section>
  );
}
