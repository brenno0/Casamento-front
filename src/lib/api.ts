export const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorPayload {
  error?: { code?: string; message?: string };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // Só corpos JSON (string); FormData/Blob deixam o navegador definir o Content-Type.
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  const text = await res.text();

  if (!res.ok) {
    let payload: ErrorPayload = {};
    try {
      payload = JSON.parse(text) as ErrorPayload;
    } catch {
      // corpo não-JSON
    }
    throw new ApiError(
      res.status,
      payload.error?.code ?? 'HTTP_ERROR',
      payload.error?.message ?? `Erro ${res.status}`,
    );
  }

  if (text === '') return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: jsonBody(body) }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PUT', body: jsonBody(body) }),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

function jsonBody(body: unknown): string | undefined {
  return body === undefined ? undefined : JSON.stringify(body);
}
