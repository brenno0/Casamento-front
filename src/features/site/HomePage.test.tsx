import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { mockFetch, renderRoute } from '../../test/renderRoute';

describe('HomePage', () => {
  it('busca o casal na API e mostra nomes e data', async () => {
    const fetchMock = mockFetch();
    renderRoute('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Nayane & Brenno' }),
    ).toBeInTheDocument();
    expect(screen.getByText('17 de julho de 2027')).toHaveAttribute('datetime', '2027-07-17');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/publico/casal',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('falhou', { status: 500 })),
    );
    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
  });
});
