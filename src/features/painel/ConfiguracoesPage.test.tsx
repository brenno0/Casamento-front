import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { mockFetch, renderRoute } from '../../test/renderRoute';

describe('ConfiguracoesPage', () => {
  it('edita o nome do noivo e o cabeçalho reflete', async () => {
    const fetchMock = mockFetch({ logado: true });
    renderRoute('/painel/configuracoes');

    const noivo = await screen.findByLabelText('Nome do noivo');
    expect(noivo).toHaveValue('Brenno');
    fireEvent.change(noivo, { target: { value: '  João  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Salvo.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/painel/casal',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ nomeNoiva: 'Nayane', nomeNoivo: 'João' }),
      }),
    );
    expect(await screen.findByText('Nayane & João')).toBeInTheDocument();
  });

  it('"Salvo." some ao editar de novo', async () => {
    mockFetch({ logado: true });
    renderRoute('/painel/configuracoes');

    const noivo = await screen.findByLabelText('Nome do noivo');
    fireEvent.change(noivo, { target: { value: 'João' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Salvo.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome do noivo'), { target: { value: 'Joã' } });
    await waitFor(() => expect(screen.queryByText('Salvo.')).not.toBeInTheDocument());
  });

  it('formulário ressincroniza quando os dados carregados mudam', async () => {
    mockFetch({ logado: true });
    const { queryClient } = renderRoute('/painel/configuracoes');
    expect(await screen.findByLabelText('Nome do noivo')).toHaveValue('Brenno');

    act(() => {
      queryClient.setQueryData(['painel', 'casal'], {
        nomeNoiva: 'Nayane',
        nomeNoivo: 'Outro',
        dataCasamento: '2027-07-17',
      });
    });

    await waitFor(() => expect(screen.getByLabelText('Nome do noivo')).toHaveValue('Outro'));
  });

  it('nome vazio bloqueia o envio', async () => {
    mockFetch({ logado: true });
    renderRoute('/painel/configuracoes');

    fireEvent.change(await screen.findByLabelText('Nome da noiva'), { target: { value: '   ' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Os dois nomes são obrigatórios.');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('sessão que expira no meio do uso leva ao login', async () => {
    const fetchMock = mockFetch({ logado: true });
    const { router } = renderRoute('/painel/configuracoes');
    await screen.findByLabelText('Nome do noivo');

    // A partir daqui a API passa a recusar a sessão.
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'x' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});
