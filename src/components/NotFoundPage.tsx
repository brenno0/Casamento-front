import { Link } from 'react-router';

export function NotFoundPage({ embedded = false }: { embedded?: boolean }) {
  const content = (
    <>
      <p className="font-display text-7xl text-folha-escuro">Ops!</p>
      <h1 className="mt-6 text-4xl">Página não encontrada</h1>
      <p className="mt-3 text-lg text-verde-suave">O endereço que você abriu não existe.</p>
      <Link to="/" className="botao-contorno mt-10">
        Voltar ao início
      </Link>
    </>
  );

  if (embedded) return <section className="py-16">{content}</section>;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-linho px-gutter text-center">
      {content}
    </main>
  );
}
