import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../lib/api';
import { Avatar } from '../painel/Avatar';

interface RecadoPainel {
  id: number;
  autorNome: string;
  texto: string;
  criadoEm: string;
  grupoNome: string;
}

const KEY = ['painel', 'mural'] as const;

export function MuralAdminPage() {
  const queryClient = useQueryClient();
  const mural = useInfiniteQuery({
    queryKey: KEY,
    queryFn: ({ pageParam }) =>
      api.get<{ recados: RecadoPainel[]; temMais: boolean }>(pageParam ? `/painel/mural?antesDe=${pageParam}` : '/painel/mural'),
    initialPageParam: 0,
    getNextPageParam: (u) => (u.temMais ? u.recados.at(-1)?.id : undefined),
  });
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const excluir = useMutation({
    mutationFn: (id: number) => api.del<void>(`/painel/mural/${id}`),
    onSuccess: () => {
      setConfirmando(null);
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
  const recados = mural.data?.pages.flatMap((p) => p.recados) ?? [];

  return (
    <section>
      <h1 className="text-4xl">Mural de recados</h1>
      <p className="mt-2 text-grafite-suave">Os recados publicam na hora para quem tem link de convite.</p>
      {mural.isPending && <p role="status" className="mt-6">Carregando…</p>}
      {mural.isError && (
        <p role="alert" className="mt-6 text-erro">
          Não foi possível carregar o mural.
        </p>
      )}
      {mural.isSuccess && recados.length === 0 && <p className="mt-6 text-grafite-suave">Nenhum recado ainda.</p>}
      <ul className="mt-6 space-y-3">
        {recados.map((r) => (
          <li key={r.id} aria-label={`Recado de ${r.autorNome}`} className="cartao-painel">
            <p className="whitespace-pre-line">{r.texto}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-grafite-suave">
              <Avatar nome={r.autorNome} className="size-6 text-[0.625rem]" />
              <span>
                {r.autorNome} · {r.grupoNome} · {new Date(r.criadoEm).toLocaleString('pt-BR')}
              </span>
              {confirmando === r.id ? (
                <>
                  <button type="button" disabled={excluir.isPending} onClick={() => excluir.mutate(r.id)} className="acao min-h-9 px-3 py-1">
                    Confirmar exclusão
                  </button>
                  <button type="button" onClick={() => setConfirmando(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmando(r.id)} className="acao-link">
                  Excluir
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {mural.hasNextPage && (
        <button type="button" onClick={() => void mural.fetchNextPage()} className="acao-secundaria mt-4">
          Carregar mais
        </button>
      )}
    </section>
  );
}
