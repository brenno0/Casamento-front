import { Fragment, useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { diasEntre, formatDataExtenso } from '../../lib/date';
import { useLogout, useSessao } from '../auth/useSessao';
import { agoraEmSaoPaulo } from '../roteiro/roteiro';
import { useCasalPublico } from '../site/useCasal';
import { Avatar } from './Avatar';
import { IconePainel, type NomeIconePainel } from './IconePainel';
import { GRUPOS_MODULOS } from './modulos';

function ItemNav({ to, icone, end, children }: { to: string; icone: NomeIconePainel; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end} className="nav-item">
      <IconePainel nome={icone} />
      {children}
    </NavLink>
  );
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
    <div className="painel min-h-svh bg-nevoa text-grafite md:flex">
      <aside className="md:sticky md:top-0 md:flex md:h-svh md:w-sidebar md:shrink-0 md:flex-col">
        <div className="px-5 pt-6 pb-3 md:pt-8 md:pb-2">
          <p className="min-h-[1.2em] font-display text-2xl leading-tight">{titulo}</p>
          {casal && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.8125rem] text-grafite-suave">
              {formatDataExtenso(casal.dataCasamento)}
              {falta && (
                <span className="selo bg-rose-claro text-rose-fundo">
                  <IconePainel nome="coracao" className="size-3" />
                  {falta}
                </span>
              )}
            </p>
          )}
        </div>
        <nav aria-label="Módulos do painel" className="overflow-x-auto px-3 pb-3 md:flex-1 md:overflow-y-auto md:pb-6">
          <ul className="flex gap-1 md:flex-col md:gap-0.5">
            <li className="md:mt-4">
              <ItemNav to="/painel" icone="inicio" end>
                Visão geral
              </ItemNav>
            </li>
            {GRUPOS_MODULOS.map((g) => (
              <Fragment key={g.titulo}>
                <li aria-hidden="true" className="nav-grupo hidden md:block">
                  {g.titulo}
                </li>
                {g.modulos.map((m) => (
                  <li key={m.slug}>
                    <ItemNav to={`/painel/${m.slug}`} icone={m.icone}>
                      {m.label}
                    </ItemNav>
                  </li>
                ))}
              </Fragment>
            ))}
            <li className="md:mt-6">
              <ItemNav to="/painel/configuracoes" icone="configuracoes">
                Configurações
              </ItemNav>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-2.5 px-5 pb-4 md:py-4">
          {conta && <Avatar nome={conta.nome} />}
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{conta?.nome}</p>
          <button
            type="button"
            aria-label="Sair"
            title="Sair"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="acao-discreta min-h-8 px-2"
          >
            <IconePainel nome="sair" />
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 md:py-2 md:pr-2">
        <div className="min-h-[calc(100svh-1rem)] bg-white px-gutter py-8 md:rounded-[1.25rem] md:border md:border-linha md:px-12 md:py-10 md:shadow-[0_1px_2px_rgb(31_26_28/0.04)]">
          <div key={pathname} className="entrada-pagina mx-auto max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
