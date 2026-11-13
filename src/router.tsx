import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { NotFoundPage } from './components/NotFoundPage';
import { LoginPage } from './features/auth/LoginPage';
import { RequireSessao } from './features/auth/RequireSessao';
import { ConvitePage } from './features/convite/ConvitePage';
import { HomePage } from './features/site/HomePage';

/**
 * Carrega a página só quando a rota é aberta: o site dos convidados não baixa o código do painel.
 * `nome` é o export do módulo.
 */
function pagina<K extends string>(carregar: () => Promise<Record<K, ComponentType>>, nome: K): RouteObject['lazy'] {
  return async () => ({ Component: (await carregar())[nome] });
}

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/c/:token', element: <ConvitePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/presente/retorno', lazy: pagina(() => import('./features/presentes/RetornoPage'), 'RetornoPage') },
  {
    element: <RequireSessao />,
    children: [
      {
        path: '/painel',
        lazy: pagina(() => import('./features/painel/PainelLayout'), 'PainelLayout'),
        children: [
          { index: true, lazy: pagina(() => import('./features/painel/PainelPages'), 'PainelHomePage') },
          { path: 'configuracoes', lazy: pagina(() => import('./features/painel/ConfiguracoesPage'), 'ConfiguracoesPage') },
          { path: 'tarefas', lazy: pagina(() => import('./features/tarefas/TarefasPage'), 'TarefasPage') },
          { path: 'fornecedores', lazy: pagina(() => import('./features/fornecedores/FornecedoresPage'), 'FornecedoresPage') },
          { path: 'financeiro', lazy: pagina(() => import('./features/financeiro/FinanceiroPage'), 'FinanceiroPage') },
          { path: 'convidados', lazy: pagina(() => import('./features/convidados/ConvidadosPage'), 'ConvidadosPage') },
          { path: 'site', lazy: pagina(() => import('./features/site-admin/SiteAdminPage'), 'SiteAdminPage') },
          { path: 'presentes', lazy: pagina(() => import('./features/presentes-admin/PresentesAdminPage'), 'PresentesAdminPage') },
          { path: 'mural', lazy: pagina(() => import('./features/mural/MuralAdminPage'), 'MuralAdminPage') },
          { path: 'viagens', lazy: pagina(() => import('./features/viagens/ViagensPage'), 'ViagensPage') },
          { path: 'viagens/:id', lazy: pagina(() => import('./features/viagens/ViagemPage'), 'ViagemPage') },
          { path: 'roteiro', lazy: pagina(() => import('./features/roteiro/RoteiroPage'), 'RoteiroPage') },
          { path: 'fornecedores/:id', lazy: pagina(() => import('./features/fornecedores/FornecedorDetalhePage'), 'FornecedorDetalhePage') },
          { path: ':modulo', lazy: pagina(() => import('./features/painel/PainelPages'), 'PainelModuloPage') },
          { path: '*', element: <NotFoundPage embedded /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
