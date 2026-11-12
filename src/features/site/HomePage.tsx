import { formatDataExtenso } from '../../lib/date';
import { useCasalPublico } from './useCasal';

export function HomePage() {
  const { data, isPending, isError } = useCasalPublico();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-marfim px-gutter py-section text-center">
      <p className="text-sm tracking-[0.3em] text-salvia-escuro uppercase">Vamos nos casar</p>

      {isPending && (
        <p className="mt-8 text-grafite-suave" role="status">
          Carregando…
        </p>
      )}

      {isError && !data && (
        <p className="mt-8 text-rosa-antigo-escuro" role="alert">
          Não foi possível carregar os dados agora. Tente novamente em instantes.
        </p>
      )}

      {data && (
        <>
          <h1 className="mt-6 font-script text-6xl leading-tight text-rosa-antigo-escuro sm:text-8xl">
            {data.nomeNoiva} &amp; {data.nomeNoivo}
          </h1>
          <div aria-hidden="true" className="mx-auto mt-6 h-px w-24 bg-dourado" />
          <p className="mt-6 font-serif text-2xl text-grafite sm:text-3xl">
            <time dateTime={data.dataCasamento}>{formatDataExtenso(data.dataCasamento)}</time>
          </p>
        </>
      )}
    </main>
  );
}
