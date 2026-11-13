import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';

export interface Recado {
  id: number;
  autorNome: string;
  texto: string;
  criadoEm: string;
}

interface Pagina {
  recados: Recado[];
  temMais: boolean;
}

const muralKey = (token: string) => ['convite', token, 'mural'] as const;

/** Mural de recados na camada convite: publica na hora, texto puro (nunca HTML). */
export function MuralSection({ token, nomePadrao }: { token: string; nomePadrao: string }) {
  const queryClient = useQueryClient();
  const base = `/convite/${encodeURIComponent(token)}/mural`;
  const mural = useInfiniteQuery({
    queryKey: muralKey(token),
    queryFn: ({ pageParam }) => api.get<Pagina>(pageParam ? `${base}?antesDe=${pageParam}` : base),
    initialPageParam: 0,
    getNextPageParam: (ultima) => (ultima.temMais ? ultima.recados.at(-1)?.id : undefined),
  });
  const [autor, setAutor] = useState(nomePadrao);
  const [texto, setTexto] = useState('');
  const enviar = useMutation({
    mutationFn: () => api.post<Recado>(base, { autorNome: autor.trim(), texto: texto.trim() }),
    onSuccess: () => {
      setTexto('');
      void queryClient.invalidateQueries({ queryKey: muralKey(token) });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!texto.trim()) return;
    enviar.mutate();
  }

  const recados = mural.data?.pages.flatMap((p) => p.recados) ?? [];
  const campo = 'mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2';

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={onSubmit} aria-label="Deixar um recado" className="space-y-3 rounded-card border border-dourado-claro bg-white p-4">
        <label className="block">
          <span className="text-sm text-grafite-suave">Seu nome</span>
          <input maxLength={80} value={autor} onChange={(e) => setAutor(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm text-grafite-suave">Recado para o casal</span>
          <textarea
            rows={3}
            maxLength={500}
            value={texto}
            onChange={(e) => {
              enviar.reset();
              setTexto(e.target.value);
            }}
            className={campo}
          />
        </label>
        <div className="flex items-center justify-between">
          <span className="text-xs text-grafite-suave">{texto.length}/500</span>
          <button type="submit" disabled={!texto.trim() || enviar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
            Publicar
          </button>
        </div>
        {enviar.isError && (
          <p role="alert" className="text-sm text-rosa-antigo-escuro">
            {enviar.error instanceof ApiError && enviar.error.status === 429 ? 'Calma! Muitos recados seguidos; tente em um minuto.' : 'Não foi possível publicar agora.'}
          </p>
        )}
      </form>

      {mural.isError && (
        <p role="alert" className="mt-6 text-center text-rosa-antigo-escuro">
          Não foi possível carregar o mural.
        </p>
      )}
      {mural.isSuccess && recados.length === 0 && <p className="mt-6 text-center text-grafite-suave">Seja o primeiro a deixar um recado!</p>}
      <ul aria-label="Recados" className="mt-6 space-y-4">
        {recados.map((r) => (
          <li key={r.id} className="animate-[aparecer_0.4s_ease-out] rounded-card bg-white p-4 shadow-suave motion-reduce:animate-none">
            <p className="whitespace-pre-line">{r.texto}</p>
            <p className="mt-2 text-sm text-grafite-suave">
              — {r.autorNome}, {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
            </p>
          </li>
        ))}
      </ul>
      {mural.hasNextPage && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => void mural.fetchNextPage()} disabled={mural.isFetchingNextPage} className="rounded-pill border border-dourado px-4 py-2">
            Carregar mais
          </button>
        </div>
      )}
    </div>
  );
}
