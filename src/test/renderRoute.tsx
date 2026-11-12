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

export const CONTA_FAKE = { id: 1, nome: 'Nayane', email: 'nayane@x.com' };
export const SENHA_FAKE = 'senha-certa';

export interface MockFetchOptions {
  /** Começa com sessão válida. */
  logado?: boolean;
  /** Caminhos (ex.: `/api/auth/me`) que respondem 500. */
  falhar?: string[];
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function erro(status: number, code: string): Response {
  return json({ error: { code, message: code } }, status);
}

/**
 * Mocka `fetch` como uma API fake com sessão em memória:
 * `/publico/casal`, `/auth/login|logout|me`, `/painel/casal` (GET/PUT). O resto, 404.
 */
export function mockFetch({ logado = false, falhar = [] }: MockFetchOptions = {}) {
  const estado = { logado, casal: { ...CASAL_FAKE } };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url, 'http://localhost').pathname;
    const method = (init.method ?? 'GET').toUpperCase();
    const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, string>) : {};

    if (falhar.includes(path)) return erro(500, 'INTERNAL_ERROR');
    if (path === '/api/publico/casal' && method === 'GET') return json(estado.casal);

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
