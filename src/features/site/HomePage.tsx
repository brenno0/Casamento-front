import type { ReactNode } from 'react';
import { Vitrine } from '../presentes/Vitrine';
import { SitePage } from './SitePage';
import { useSitePublico } from './useSite';

export function Carregando({ erro }: { erro: boolean }): ReactNode {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-linho px-gutter text-center">
      <p className="font-display text-4xl text-verde sm:text-5xl">Carregando o nosso dia…</p>
      {erro ? (
        <p className="mt-6 text-lg text-erro" role="alert">
          Não foi possível carregar o site agora. Tente novamente em instantes.
        </p>
      ) : (
        <p className="sr-only" role="status">
          Carregando…
        </p>
      )}
    </main>
  );
}

/** Site na camada pública (`/`): sem endereços, mapas, RSVP nem mural. */
export function HomePage() {
  const { data, isError } = useSitePublico();
  if (!data) return <Carregando erro={isError} />;
  return <SitePage camada="publico" site={data} slots={{ presentes: <Vitrine token={null} /> }} />;
}
