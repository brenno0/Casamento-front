import { Link } from 'react-router';

export function NotFoundPage({ embedded = false }: { embedded?: boolean }) {
  const content = (
    <>
      <p className="font-script text-6xl text-rosa-antigo-escuro">Ops!</p>
      <h1 className="mt-4 text-3xl">Página não encontrada</h1>
      <p className="mt-2 text-grafite-suave">O endereço que você abriu não existe.</p>
      <Link to="/" className="mt-6 inline-block text-salvia-escuro underline underline-offset-4">
        Voltar ao início
      </Link>
    </>
  );

  if (embedded) return <section className="py-8 text-center">{content}</section>;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-marfim px-gutter text-center">
      {content}
    </main>
  );
}
