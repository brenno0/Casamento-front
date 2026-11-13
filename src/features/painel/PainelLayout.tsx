import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useLogout, useSessao } from '../auth/useSessao';
import { useCasalPublico } from '../site/useCasal';
import { MODULOS_PAINEL } from './modulos';

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'block rounded-pill px-4 py-1.5 whitespace-nowrap transition-colors',
    isActive
      ? 'bg-rosa-antigo-claro text-rosa-antigo-escuro'
      : 'text-grafite-suave hover:bg-marfim-escuro hover:text-grafite',
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
    <div className="min-h-svh bg-marfim md:flex">
      <aside className="border-b border-dourado-claro bg-white/60 md:flex md:w-sidebar md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="px-gutter py-4 md:py-8">
          <p className="min-h-[1.5em] font-script text-4xl text-rosa-antigo-escuro">{titulo}</p>
          <p className="text-sm tracking-[0.2em] text-salvia-escuro uppercase">Painel do casal</p>
        </div>
        <nav aria-label="Módulos do painel" className="overflow-x-auto px-2 pb-3 md:pb-8">
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
        <div className="flex items-center justify-between gap-3 border-t border-dourado-claro px-gutter py-3 md:mt-auto md:py-6">
          <p className="truncate text-grafite-suave">{conta?.nome}</p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded-pill px-4 py-1.5 text-rosa-antigo-escuro transition-colors hover:bg-rosa-antigo-claro disabled:opacity-60"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-gutter py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
