import { fireEvent, screen, waitFor } from '@testing-library/react';
import { CONTA_FAKE, mockFetch, renderRoute, SENHA_FAKE } from '../../test/renderRoute';
import { destinoSeguro, SESSAO_QUERY_KEY } from './useSessao';

function preencherLogin(email: string, senha: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('acesso do casal', () => {
  it('sem sessão, /painel redireciona para /login com next', async () => {
    mockFetch();
    const { router } = renderRoute('/painel/fornecedores?x=1');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/painel/fornecedores?x=1')}`);
    expect(screen.queryByRole('navigation', { name: 'Módulos do painel' })).not.toBeInTheDocument();
  });

  it('login com sucesso leva ao painel e mostra o nome da conta', async () => {
    const fetchMock = mockFetch();
    const { router } = renderRoute('/login');

    preencherLogin(` ${CONTA_FAKE.email} `, SENHA_FAKE);

    expect(await screen.findByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/painel');
    expect(screen.getByText(CONTA_FAKE.nome)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email: CONTA_FAKE.email, senha: SENHA_FAKE }),
      }),
    );
  });

  it('login com sucesso volta para o next', async () => {
    mockFetch();
    const { router } = renderRoute(`/login?next=${encodeURIComponent('/painel/financeiro')}`);

    preencherLogin(CONTA_FAKE.email, SENHA_FAKE);

    expect(await screen.findByRole('heading', { name: 'Financeiro' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/painel/financeiro');
  });

  it('login com erro mostra mensagem amigável e continua no login', async () => {
    mockFetch();
    const { router } = renderRoute('/login');

    preencherLogin(CONTA_FAKE.email, 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(router.state.location.pathname).toBe('/login');
  });

  it('com sessão, /login vai direto para o painel', async () => {
    mockFetch({ logado: true });
    const { router } = renderRoute('/login');

    expect(await screen.findByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/painel');
  });

  it('sair volta ao login e /painel passa a redirecionar', async () => {
    const fetchMock = mockFetch({ logado: true });
    const { router } = renderRoute('/painel');

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );

    await router.navigate('/painel');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('sair remove os dados do painel do cache', async () => {
    mockFetch({ logado: true });
    const { queryClient } = renderRoute('/painel/configuracoes');
    await screen.findByLabelText('Nome do noivo');
    expect(queryClient.getQueryData(['painel', 'casal'])).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(queryClient.getQueryCache().findAll({ queryKey: ['painel'] })).toHaveLength(0);
    expect(queryClient.getQueryData(SESSAO_QUERY_KEY)).toBeNull();
  });

  it('logout que falha na API ainda termina no /login', async () => {
    mockFetch({ logado: true, falhar: ['/api/auth/logout'] });
    const { router } = renderRoute('/painel');

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    // Não volta para o painel por causa de sessão em cache.
    expect(screen.queryByRole('navigation', { name: 'Módulos do painel' })).not.toBeInTheDocument();
  });

  it('GET do painel com 401 e /auth/me em cache leva ao login', async () => {
    const fetchMock = mockFetch({ logado: true });
    const { router, queryClient } = renderRoute('/painel');
    await screen.findByRole('heading', { name: 'Visão geral' });
    expect(queryClient.getQueryData(SESSAO_QUERY_KEY)).toEqual(CONTA_FAKE);

    fetchMock.estado.logado = false; // sessão expira no servidor
    await router.navigate('/painel/configuracoes');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(queryClient.getQueryCache().findAll({ queryKey: ['painel'] })).toHaveLength(0);
  });

  it('falha ao verificar a sessão mostra alerta e "Tentar de novo" sem sair do painel', async () => {
    const fetchMock = mockFetch({ logado: true, falhar: ['/api/auth/me'] });
    const { router } = renderRoute('/painel');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível verificar seu acesso agora.',
    );
    const retry = screen.getByRole('button', { name: 'Tentar de novo' });
    expect(router.state.location.pathname).toBe('/painel');

    fetchMock.mockClear();
    fireEvent.click(retry);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.anything()),
    );
    expect(router.state.location.pathname).toBe('/painel');
  });

  it('cabeçalho mostra "Painel" quando os nomes do casal não carregam', async () => {
    mockFetch({ logado: true, falhar: ['/api/publico/casal'] });
    renderRoute('/painel');
    expect(await screen.findByText('Painel')).toBeInTheDocument();
  });

  it('cabeçalho do painel mostra os nomes do casal vindos da API', async () => {
    mockFetch({ logado: true });
    renderRoute('/painel');
    expect(await screen.findByText('Nayane & Brenno')).toBeInTheDocument();
  });
});

describe('destinoSeguro', () => {
  it.each([
    [null, '/painel'],
    ['', '/painel'],
    ['https://mal.com', '/painel'],
    ['//mal.com', '/painel'],
    ['/\\mal.com', '/painel'],
    ['/\t/mal.com', '/painel'],
    ['/\r\n/mal.com', '/painel'],
    ['/login', '/painel'],
    ['/login?next=/painel', '/painel'],
    ['/', '/painel'],
    ['/painelx', '/painel'],
    ['/painel', '/painel'],
    ['/painel/tarefas?a=1', '/painel/tarefas?a=1'],
    ['/pai\tnel/tarefas', '/painel/tarefas'],
  ])('%j → %s', (next, esperado) => {
    expect(destinoSeguro(next)).toBe(esperado);
  });
});
