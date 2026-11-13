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
  const rotulo = 'text-sm font-medium text-verde-suave';

  return (
    <div className="max-w-2xl">
      <form onSubmit={onSubmit} aria-label="Deixar um recado" className="space-y-5">
        <label className="block">
          <span className={rotulo}>Seu nome</span>
          <input maxLength={80} value={autor} onChange={(e) => setAutor(e.target.value)} className="campo bg-linho" />
        </label>
        <label className="block">
          <span className={rotulo}>Recado para o casal</span>
          <textarea
            rows={4}
            maxLength={500}
            value={texto}
            onChange={(e) => {
              enviar.reset();
              setTexto(e.target.value);
            }}
            className="campo bg-linho"
          />
        </label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-verde-suave">{texto.length}/500</span>
          <button type="submit" disabled={!texto.trim() || enviar.isPending} className="botao">
            Publicar
          </button>
        </div>
        {enviar.isError && (
          <p role="alert" className="text-sm text-erro">
            {enviar.error instanceof ApiError && enviar.error.status === 429 ? 'Calma! Muitos recados seguidos; tente em um minuto.' : 'Não foi possível publicar agora.'}
          </p>
        )}
      </form>

      {mural.isError && (
        <p role="alert" className="mt-12 text-erro">
          Não foi possível carregar o mural.
        </p>
      )}
      {mural.isSuccess && recados.length === 0 && <p className="mt-12 text-verde-suave">Seja o primeiro a deixar um recado!</p>}
      <ul aria-label="Recados" className="mt-16 border-t border-folha-escuro empty:hidden">
        {recados.map((r) => (
          <li key={r.id} className="animate-[aparecer_0.4s_ease-out] border-b border-folha-escuro py-8 motion-reduce:animate-none">
            <p className="font-caslon text-xl leading-relaxed whitespace-pre-line text-verde">{r.texto}</p>
            <p className="mt-4 text-sm text-verde-suave">
              {r.autorNome}, {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
            </p>
          </li>
        ))}
      </ul>
      {mural.hasNextPage && (
        <div className="mt-8">
          <button type="button" onClick={() => void mural.fetchNextPage()} disabled={mural.isFetchingNextPage} className="botao-contorno">
            Carregar mais
          </button>
        </div>
      )}
    </div>
  );
}
