import { createBrowserRouter, type RouteObject } from 'react-router';
import { NotFoundPage } from './components/NotFoundPage';
import { LoginPage } from './features/auth/LoginPage';
import { ConvitePage } from './features/convite/ConvitePage';
import { PainelLayout } from './features/painel/PainelLayout';
import { PainelHomePage, PainelModuloPage } from './features/painel/PainelPages';
import { HomePage } from './features/site/HomePage';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/c/:token', element: <ConvitePage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/painel',
    element: <PainelLayout />,
    children: [
      { index: true, element: <PainelHomePage /> },
      { path: ':modulo', element: <PainelModuloPage /> },
      { path: '*', element: <NotFoundPage embedded /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
