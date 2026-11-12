import { createBrowserRouter, type RouteObject } from 'react-router';
import { NotFoundPage } from './components/NotFoundPage';
import { LoginPage } from './features/auth/LoginPage';
import { RequireSessao } from './features/auth/RequireSessao';
import { ConvitePage } from './features/convite/ConvitePage';
import { ConfiguracoesPage } from './features/painel/ConfiguracoesPage';
import { PainelLayout } from './features/painel/PainelLayout';
import { PainelHomePage, PainelModuloPage } from './features/painel/PainelPages';
import { HomePage } from './features/site/HomePage';
import { ConvidadosPage } from './features/convidados/ConvidadosPage';
import { FinanceiroPage } from './features/financeiro/FinanceiroPage';
import { FornecedorDetalhePage } from './features/fornecedores/FornecedorDetalhePage';
import { FornecedoresPage } from './features/fornecedores/FornecedoresPage';
import { TarefasPage } from './features/tarefas/TarefasPage';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/c/:token', element: <ConvitePage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireSessao />,
    children: [
      {
        path: '/painel',
        element: <PainelLayout />,
        children: [
          { index: true, element: <PainelHomePage /> },
          { path: 'configuracoes', element: <ConfiguracoesPage /> },
          { path: 'tarefas', element: <TarefasPage /> },
          { path: 'fornecedores', element: <FornecedoresPage /> },
          { path: 'financeiro', element: <FinanceiroPage /> },
          { path: 'convidados', element: <ConvidadosPage /> },
          { path: 'fornecedores/:id', element: <FornecedorDetalhePage /> },
          { path: ':modulo', element: <PainelModuloPage /> },
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
