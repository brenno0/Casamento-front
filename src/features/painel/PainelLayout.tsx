import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useLogout, useSessao } from '../auth/useSessao';
import { useCasalPublico } from '../site/useCasal';
import { MODULOS_PAINEL } from './modulos';

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'block rounded-botao px-4 py-2 whitespace-nowrap transition-colors',
    isActive ? 'bg-linho font-semibold text-verde' : 'text-linho/80 hover:bg-linho/10 hover:text-linho',
  ].join(' ');
}

export function PainelLayout() {
  const { data: conta } = useSessao();
  const { data: casal, isError: casalFalhou } = useCasalPublico();
  const logout = useLogout();

  const nomes = casal ? `${casal.nomeNoiva} & ${casal.nomeNoivo}` : null;
  const titulo = nomes ?? (casalFalhou ? 'Painel' : null);

  useEffect(() => {
    if (!nomes) return;
    const anterior = document.title;
    document.title = `Painel · ${nomes}`;
    return () => {
      document.title = anterior;
    };
  }, [nomes]);

  return (
    <div className="min-h-svh bg-linho md:flex">
      <aside className="bg-verde text-linho md:sticky md:top-0 md:flex md:h-svh md:w-sidebar md:shrink-0 md:flex-col">
        <div className="px-gutter pt-6 pb-4 md:pt-10 md:pb-8">
          <p className="min-h-[1.2em] font-display text-3xl leading-tight">{titulo}</p>
          <p className="mt-1 text-sm text-linho/70">Painel do casal</p>
        </div>
        <nav aria-label="Módulos do painel" className="overflow-x-auto px-3 pb-4 md:flex-1 md:overflow-y-auto md:pb-8">
          <ul className="flex gap-1 md:flex-col">
            <li>
              <NavLink to="/painel" end className={navClass}>
                Visão geral
              </NavLink>
            </li>
            {MODULOS_PAINEL.map((m) => (
              <li key={m.slug}>
                <NavLink to={`/painel/${m.slug}`} className={navClass}>
                  {m.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/painel/configuracoes" className={navClass}>
                Configurações
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="flex items-center justify-between gap-3 border-t border-linho/15 px-gutter py-3 md:py-5">
          <p className="truncate text-linho/80">{conta?.nome}</p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded-botao px-4 py-1.5 text-linho transition-colors hover:bg-linho/10 disabled:opacity-60"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-gutter py-10 md:px-14 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
