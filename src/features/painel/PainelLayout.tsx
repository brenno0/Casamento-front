import { NavLink, Outlet } from 'react-router';
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
  return (
    <div className="min-h-svh bg-marfim md:flex">
      <aside className="border-b border-dourado-claro bg-white/60 md:w-sidebar md:shrink-0 md:border-r md:border-b-0">
        <div className="px-gutter py-4 md:py-8">
          <p className="font-script text-4xl text-rosa-antigo-escuro">Nayane &amp; Brenno</p>
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
          </ul>
        </nav>
      </aside>
      <main className="flex-1 px-gutter py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
