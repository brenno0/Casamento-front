import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';
import { calcularCobranca, navegador } from './checkout';
import type { ItemVitrine } from './usePresentes';

const ITENS: ItemVitrine[] = [
  { id: 1, nome: 'Jogo de taças', descricao: '', fotoUrl: null, precoCentavos: 20000, fracionavel: false, cotaMinimaCentavos: 5000, restante: 1, progresso: 0, esgotado: false, linkLoja: null, viagem: null },
  { id: 3, nome: 'Passeio de barco', descricao: '', fotoUrl: null, precoCentavos: 100000, fracionavel: true, cotaMinimaCentavos: 5000, restante: 1, progresso: 30, esgotado: false, linkLoja: null, viagem: null },
];

function api(opts: { disponivel?: boolean; erroCheckout?: string } = {}) {
  return ({ method, path }: { method: string; path: string }) => {
    if (path === '/publico/presentes') return json(ITENS);
    if (path === '/publico/checkout/taxas') return json({ disponivel: opts.disponivel ?? true, pixPct: 0.99, cartaoPct: 4.98 });
    if (/\/checkout$/.test(path) && method === 'POST') {
      return opts.erroCheckout ? erro(409, opts.erroCheckout) : json({ presenteId: 7, checkoutUrl: 'https://mp.test/checkout/7' }, 201);
    }
    return undefined;
  };
}

describe('checkout', () => {
  it('cálculo igual ao do servidor', () => {
    expect(calcularCobranca(20000, 0.99)).toEqual({ cobradoCentavos: 20200, taxaCentavos: 200 });
  });

  it('item inteiro por PIX mostra taxa e total e redireciona ao Mercado Pago', async () => {
    const ir = vi.spyOn(navegador, 'ir').mockImplementation(() => {});
    const fetchMock = mockFetch({ rotas: api() });
    renderRoute('/');
    const tacas = await screen.findByRole('article', { name: 'Jogo de taças' });
    fireEvent.click(await within(tacas).findByRole('button', { name: 'Presentear' }));
    const dialog = screen.getByRole('dialog', { name: /Presentear/ });
    expect(within(dialog).getByLabelText('Resumo do pagamento')).toHaveTextContent('R$ 200,00 + taxa do Mercado Pago R$ 2,00 = R$ 202,00');
    fireEvent.click(within(dialog).getByText('Cartão'));
    expect(within(dialog).getByLabelText('Resumo do pagamento')).toHaveTextContent('= R$ 210,49');
    fireEvent.click(within(dialog).getByText('PIX'));

    const ir2 = within(dialog).getByRole('button', { name: 'Ir para o pagamento' });
    expect(ir2).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Seu nome'), { target: { value: 'Tia Rosa' } });
    fireEvent.change(within(dialog).getByLabelText(/Seu e-mail/), { target: { value: 'tia@x.com' } });
    fireEvent.click(ir2);
    await waitFor(() => expect(ir).toHaveBeenCalledWith('https://mp.test/checkout/7'));
    const post = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/publico/presentes/1/checkout'));
    expect(JSON.parse(String(post![1]!.body))).toEqual({ doadorNome: 'Tia Rosa', doadorEmail: 'tia@x.com', mensagem: '', metodo: 'pix' });
  });

  it('cota abaixo do mínimo avisa; válida envia valorCentavos', async () => {
    vi.spyOn(navegador, 'ir').mockImplementation(() => {});
    const fetchMock = mockFetch({ rotas: api() });
    renderRoute('/');
    const barco = await screen.findByRole('article', { name: 'Passeio de barco' });
    fireEvent.click(await within(barco).findByRole('button', { name: 'Dar uma cota' }));
    const dialog = screen.getByRole('dialog', { name: /Presentear/ });
    const valor = within(dialog).getByLabelText(/Valor da cota/);
    fireEvent.change(valor, { target: { value: '30,00' } });
    expect(within(dialog).getByRole('alert')).toHaveTextContent('A cota mínima é R$ 50,00.');
    fireEvent.change(valor, { target: { value: '150' } });
    fireEvent.change(within(dialog).getByLabelText('Seu nome'), { target: { value: 'A' } });
    fireEvent.change(within(dialog).getByLabelText(/Seu e-mail/), { target: { value: 'a@x.com' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ir para o pagamento' }));
    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/publico/presentes/3/checkout'));
      expect(JSON.parse(String(post![1]!.body))).toMatchObject({ valorCentavos: 15000 });
    });
  });

  it('esgotado no servidor mostra mensagem amigável', async () => {
    mockFetch({ rotas: api({ erroCheckout: 'ITEM_ESGOTADO' }) });
    renderRoute('/');
    const tacas = await screen.findByRole('article', { name: 'Jogo de taças' });
    fireEvent.click(await within(tacas).findByRole('button', { name: 'Presentear' }));
    const dialog = screen.getByRole('dialog', { name: /Presentear/ });
    fireEvent.change(within(dialog).getByLabelText('Seu nome'), { target: { value: 'A' } });
    fireEvent.change(within(dialog).getByLabelText(/Seu e-mail/), { target: { value: 'a@x.com' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ir para o pagamento' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('acabou de ser escolhido');
  });

  it('sem checkout disponível não mostra o botão', async () => {
    mockFetch({ rotas: api({ disponivel: false }) });
    renderRoute('/');
    const tacas = await screen.findByRole('article', { name: 'Jogo de taças' });
    await waitFor(() => expect(within(tacas).queryByRole('button', { name: 'Presentear' })).not.toBeInTheDocument());
    expect(within(tacas).getByRole('button', { name: 'Já comprei' })).toBeInTheDocument();
  });

  it('página de retorno não confirma nada', async () => {
    mockFetch();
    renderRoute('/presente/retorno');
    expect(await screen.findByText(/Estamos confirmando o seu presente/)).toBeInTheDocument();
  });
});
