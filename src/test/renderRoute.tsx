import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { createQueryClient } from '../lib/queryClient';
import { routes } from '../router';

export const CASAL_FAKE = {
  nomeNoiva: 'Nayane',
  nomeNoivo: 'Brenno',
  dataCasamento: '2027-07-17',
};

export const TOKEN_FAKE = 'token-convite-valido-0123456789abcdef';

export function siteFake(estado: { casal: typeof CASAL_FAKE }) {
  return {
    casal: estado.casal,
    historia: [{ id: 1, data: '2019-03-10', titulo: 'Nos conhecemos', texto: 'Num show.', fotoUrl: null }],
    locais: [
      { tipo: 'cerimonia', nome: 'Igreja Matriz', data: '2027-07-17', horario: '16:00' },
      { tipo: 'festa', nome: 'Espaço Jardim', data: '2027-07-17', horario: '18:30' },
    ],
    dressCode: { texto: 'Traje social.', paleta: ['#c9a9a6', '#9caf88'] },
    galeria: [],
    faq: [{ id: 1, pergunta: 'Pode levar criança?', resposta: 'Sim!' }],
  };
}

export function siteConviteFake(estado: { casal: typeof CASAL_FAKE }) {
  const base = siteFake(estado);
  return {
    ...base,
    locais: base.locais.map((l, i) => ({
      ...l,
      endereco: i === 0 ? 'Rua da Igreja, 10 - Porto Seguro' : 'Estrada do Jardim, 20',
      latitude: -16.44 + i / 100,
      longitude: -39.06,
    })),
    grupo: { nome: 'Família Souza', mensagem: 'Contamos com vocês!' },
  };
}

export const CONTA_FAKE = { id: 1, nome: 'Nayane', email: 'nayane@x.com' };
export const SENHA_FAKE = 'senha-certa';

export interface MockFetchOptions {
  /** Começa com sessão válida. */
  logado?: boolean;
  /** Caminhos (ex.: `/api/auth/me`) que respondem 500. */
  falhar?: string[];
  /**
   * Rotas extras do painel (só com sessão). Devolver `undefined` deixa seguir para as rotas padrão.
   * `path` vem sem `/api`; `search` inclui o `?`.
   */
  rotas?: (req: { method: string; path: string; search: string; body: unknown }) => Response | undefined;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function erro(status: number, code: string): Response {
  return json({ error: { code, message: code } }, status);
}

/**
 * Mocka `fetch` como uma API fake com sessão em memória:
 * `/publico/casal`, `/auth/login|logout|me`, `/painel/casal` (GET/PUT). O resto, 404.
 */
export function mockFetch({ logado = false, falhar = [], rotas }: MockFetchOptions = {}) {
  const estado = { logado, casal: { ...CASAL_FAKE } };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const { pathname: path, search } = new URL(url, 'http://localhost');
    const method = (init.method ?? 'GET').toUpperCase();
    const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, string>) : {};

    if (falhar.includes(path)) return erro(500, 'INTERNAL_ERROR');
    if (path === '/api/publico/casal' && method === 'GET') return json(estado.casal);
    if (path === '/api/publico/site' && method === 'GET') return json(siteFake(estado));
    if (path === `/api/convite/${TOKEN_FAKE}/site` && method === 'GET') return json(siteConviteFake(estado));
    if (path.startsWith('/api/convite/') && path.endsWith('/site')) return erro(404, 'CONVITE_NOT_FOUND');
    if (path.startsWith('/api/convite/')) {
      const extra = rotas?.({ method, path: path.slice('/api'.length), search, body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined });
      if (extra) return extra;
    }

    if (path === '/api/auth/login' && method === 'POST') {
      if (body.email === CONTA_FAKE.email && body.senha === SENHA_FAKE) {
        estado.logado = true;
        return json({ conta: CONTA_FAKE });
      }
      return erro(401, 'INVALID_CREDENTIALS');
    }
    if (path === '/api/auth/logout' && method === 'POST') {
      estado.logado = false;
      return new Response(null, { status: 204 });
    }
    if (path === '/api/auth/me' && method === 'GET') {
      return estado.logado ? json({ conta: CONTA_FAKE }) : erro(401, 'UNAUTHENTICATED');
    }

    if (path.startsWith('/api/painel/')) {
      if (!estado.logado) return erro(401, 'UNAUTHENTICATED');
      const extra = rotas?.({
        method,
        path: path.slice('/api'.length),
        search,
        body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
      });
      if (extra) return extra;
      if (path === '/api/painel/casal' && method === 'GET') return json(estado.casal);
      if (path === '/api/painel/casal' && method === 'PUT') {
        estado.casal = { ...estado.casal, ...body };
        return json(estado.casal);
      }
    }

    return erro(404, 'NOT_FOUND');
  });
  vi.stubGlobal('fetch', fetchMock);
  // `estado` permite mudar a API fake no meio do teste (ex.: sessão expira).
  return Object.assign(fetchMock, { estado });
}

export function renderRoute(path: string) {
  // Mesmo cliente da app (inclui o tratamento global de 401), sem repetições.
  const queryClient = createQueryClient();
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
}
