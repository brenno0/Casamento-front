import { Navigate, Outlet, useLocation } from 'react-router';
import { useSessao } from './useSessao';

/** Guarda de rota: sem sessão, manda para `/login?next=<rota atual>`. */
export function RequireSessao() {
  const location = useLocation();
  const { data: conta, isPending, isError, refetch } = useSessao();

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-linho">
        <p className="text-verde-suave" role="status">
          Carregando…
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-linho px-gutter text-center">
        <p className="text-erro" role="alert">
          Não foi possível verificar seu acesso agora.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-botao bg-verde px-6 py-2 text-linho"
        >
          Tentar de novo
        </button>
      </main>
    );
  }

  if (!conta) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
