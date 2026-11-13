import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { json, mockFetch, renderRoute, TOKEN_FAKE } from '../../test/renderRoute';
import type { ItemVitrine } from './usePresentes';

function itens(): ItemVitrine[] {
  return [
    { id: 1, nome: 'Jogo de taças', descricao: '', fotoUrl: null, precoCentavos: 30000, fracionavel: false, cotaMinimaCentavos: 5000, restante: 1, progresso: 0, esgotado: false, linkLoja: 'https://loja.com/tacas' },
    { id: 2, nome: 'Liquidificador', descricao: '', fotoUrl: null, precoCentavos: 20000, fracionavel: false, cotaMinimaCentavos: 5000, restante: 0, progresso: 0, esgotado: true, linkLoja: null },
    { id: 3, nome: 'Passeio de barco', descricao: 'Na lua de mel', fotoUrl: null, precoCentavos: 100000, fracionavel: true, cotaMinimaCentavos: 5000, restante: 1, progresso: 30, esgotado: false, linkLoja: null },
  ];
}

function api() {
  return ({ method, path }: { method: string; path: string }) => {
    if ((path === '/publico/presentes' || path === `/convite/${TOKEN_FAKE}/presentes`) && method === 'GET') return json(itens());
    if (/ja-comprei$/.test(path) && method === 'POST') return json({ id: 1 }, 201);
    return undefined;
  };
}

describe('vitrine', () => {
  it('mostra preço, progresso da cota, "Já escolhido" e loja', async () => {
    mockFetch({ rotas: api() });
    renderRoute('/');
    const tacas = await screen.findByRole('article', { name: 'Jogo de taças' });
    expect(within(tacas).getByText('R$ 300,00')).toBeInTheDocument();
    expect(within(tacas).getByRole('link', { name: 'Comprar na loja' })).toHaveAttribute('href', 'https://loja.com/tacas');
    expect(within(screen.getByRole('article', { name: 'Liquidificador' })).getByText('Já escolhido')).toBeInTheDocument();
    const barco = screen.getByRole('article', { name: 'Passeio de barco' });
    expect(within(barco).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
    expect(within(barco).queryByRole('button', { name: 'Já comprei' })).not.toBeInTheDocument();
  });

  it('Já comprei no público exige nome e agradece', async () => {
    const fetchMock = mockFetch({ rotas: api() });
    renderRoute('/');
    const tacas = await screen.findByRole('article', { name: 'Jogo de taças' });
    fireEvent.click(within(tacas).getByRole('button', { name: 'Já comprei' }));
    const dialog = screen.getByRole('dialog', { name: /Já comprei/ });
    expect(within(dialog).getByRole('button', { name: 'Avisar o casal' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Seu nome'), { target: { value: 'Tia Rosa' } });
    fireEvent.change(within(dialog).getByLabelText(/Nº do pedido/), { target: { value: 'A123' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Avisar o casal' }));
    expect(await screen.findByRole('heading', { name: 'Muito obrigado!' })).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/publico/presentes/1/ja-comprei'));
    expect(JSON.parse(String(post![1]!.body))).toMatchObject({ doadorNome: 'Tia Rosa', numeroPedido: 'A123' });
  });

  it('no convite o nome vem preenchido com o grupo e usa a rota do convite', async () => {
    sessionStorage.setItem(`envelope-aberto:${TOKEN_FAKE}`, '1');
    const fetchMock = mockFetch({ rotas: api() });
    renderRoute(`/c/${TOKEN_FAKE}`);
    const tacas = await screen.findByRole('article', { name: 'Jogo de taças' });
    fireEvent.click(within(tacas).getByRole('button', { name: 'Já comprei' }));
    const dialog = screen.getByRole('dialog', { name: /Já comprei/ });
    expect(within(dialog).getByLabelText('Seu nome')).toHaveValue('Família Souza');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Avisar o casal' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith(`/convite/${TOKEN_FAKE}/presentes/1/ja-comprei`))).toBe(true),
    );
  });
});

describe('presentes no painel', () => {
  it('marca presente comprado como recebido', async () => {
    let status = 'comprado';
    const fetchMock = mockFetch({
      logado: true,
      rotas: ({ method, path }) => {
        if (path === '/painel/presentes' && method === 'GET') {
          return json([
            { id: 9, itemId: 1, itemNome: 'Jogo de taças', via: 'loja', status, doadorNome: 'Tia Rosa', doadorEmail: null, mensagem: 'Felicidades', valorCentavos: 30000, valorCobradoCentavos: null, taxaCentavos: null, metodo: null, numeroPedido: 'A123', fotoArquivoId: null, criadoEm: '2027-05-01T12:00:00Z', pagoEm: null, recebidoEm: null },
          ]);
        }
        if (path === '/painel/presentes/9/recebido') {
          status = 'recebido';
          return json({});
        }
        if (path === '/painel/presentes/itens') return json([]);
        return undefined;
      },
    });
    renderRoute('/painel/presentes');
    fireEvent.click(await screen.findByRole('tab', { name: 'Presentes recebidos' }));
    const item = await screen.findByRole('listitem', { name: 'Presente de Tia Rosa' });
    expect(within(item).getByText(/Felicidades/)).toBeInTheDocument();
    fireEvent.click(within(item).getByRole('button', { name: 'Marcar recebido' }));
    expect(await within(screen.getByRole('listitem', { name: 'Presente de Tia Rosa' })).findByText('Recebido')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/painel/presentes/9/recebido', expect.objectContaining({ method: 'POST' }));
  });
});
