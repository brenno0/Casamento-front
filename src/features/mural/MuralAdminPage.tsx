import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Avatar } from '../painel/Avatar';
import { BotaoSegurar } from '../painel/BotaoSegurar';
import { Esqueleto } from '../painel/Esqueleto';
import { Vazio } from '../painel/Vazio';

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
  const excluir = useMutation({
    mutationFn: (id: number) => api.del<void>(`/painel/mural/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
  const recados = mural.data?.pages.flatMap((p) => p.recados) ?? [];

  return (
    <section>
      <h1 className="text-4xl">Mural de recados</h1>
      <p className="mt-2 text-grafite-suave">Os recados publicam na hora para quem tem link de convite.</p>
      {mural.isPending && <Esqueleto className="mt-6" />}
      {mural.isError && (
        <p role="alert" className="mt-6 text-erro">
          Não foi possível carregar o mural.
        </p>
      )}
      {mural.isSuccess && recados.length === 0 && <Vazio icone="mural" className="mt-6">Nenhum recado ainda.</Vazio>}
      <ul className="mt-6 space-y-3">
        {recados.map((r) => (
          <li key={r.id} aria-label={`Recado de ${r.autorNome}`} className="cartao-painel">
            <p className="whitespace-pre-line">{r.texto}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-grafite-suave">
              <Avatar nome={r.autorNome} className="size-6 text-[0.625rem]" />
              <span>
                {r.autorNome} · {r.grupoNome} · {new Date(r.criadoEm).toLocaleString('pt-BR')}
              </span>
              <BotaoSegurar disabled={excluir.isPending} onConfirmar={() => excluir.mutate(r.id)} className="ml-auto min-h-8 px-3">
                Excluir
              </BotaoSegurar>
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
