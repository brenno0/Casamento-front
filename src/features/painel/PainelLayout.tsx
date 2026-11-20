import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { diasEntre, formatDataExtenso } from '../../lib/date';
import { useLogout, useSessao } from '../auth/useSessao';
import { agoraEmSaoPaulo } from '../roteiro/roteiro';
import { useCasalPublico } from '../site/useCasal';
import { MODULOS_PAINEL } from './modulos';

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'block rounded-botao px-4 py-2 whitespace-nowrap transition-colors',
    isActive
      ? 'bg-linho/10 font-semibold text-linho shadow-[inset_0_-2px_0_var(--color-vela)] md:shadow-[inset_2px_0_0_var(--color-vela)]'
      : 'text-linho/75 hover:bg-linho/5 hover:text-linho',
  ].join(' ');
}

function contagem(dataCasamento: string): string | null {
  const dias = diasEntre(agoraEmSaoPaulo(new Date()).dia, dataCasamento);
  if (dias < 0) return null;
  if (dias === 0) return 'É hoje';
  return dias === 1 ? 'Falta 1 dia' : `Faltam ${dias} dias`;
}

export function PainelLayout() {
  const { pathname } = useLocation();
  const { data: conta } = useSessao();
  const { data: casal, isError: casalFalhou } = useCasalPublico();
  const logout = useLogout();

  const nomes = casal ? `${casal.nomeNoiva} & ${casal.nomeNoivo}` : null;
  const titulo = nomes ?? (casalFalhou ? 'Painel' : null);
  const falta = casal ? contagem(casal.dataCasamento) : null;

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
          {casal && (
            <p className="mt-2 text-sm text-linho/70">
              {formatDataExtenso(casal.dataCasamento)}
              {falta && <span className="block font-semibold text-vela">{falta}</span>}
            </p>
          )}
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
            <li className="md:mt-4 md:border-t md:border-linho/15 md:pt-4">
              <NavLink to="/painel/configuracoes" className={navClass}>
                Configurações
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="flex items-center justify-between gap-3 border-t border-linho/15 px-gutter py-3 md:py-5">
          <p className="truncate text-sm text-linho/75">{conta?.nome}</p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded-botao px-3 py-1.5 text-sm text-linho/90 transition-colors hover:bg-linho/10 hover:text-linho disabled:opacity-60"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-gutter py-8 text-base md:px-12 md:py-12">
        <div key={pathname} className="painel-conteudo entrada-pagina mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
