import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';
import type { Contrato, Dashboard } from './useFinanceiro';

const DASH: Dashboard = {
  hoje: '2027-02-01',
  categorias: [
    { id: 1, nome: 'Buffet', previstoCentavos: 3000000, contratadoCentavos: 2500000, pagoCentavos: 1000000 },
    { id: 2, nome: 'Música', previstoCentavos: 500000, contratadoCentavos: 0, pagoCentavos: 0 },
  ],
  totais: { previstoCentavos: 3500000, contratadoCentavos: 2500000, pagoCentavos: 1000000 },
  proximosVencimentos: [
    { id: 7, contratoId: 1, vencimento: '2027-02-15', valorCentavos: 50000, status: 'pendente', pagoEm: null, comprovanteArquivoId: null, atrasada: false, contratoDescricao: 'Buffet completo', categoriaNome: 'Buffet' },
  ],
  atrasadas: [
    { id: 6, contratoId: 1, vencimento: '2027-01-31', valorCentavos: 70000, status: 'pendente', pagoEm: null, comprovanteArquivoId: null, atrasada: true, contratoDescricao: 'Buffet completo', categoriaNome: 'Buffet' },
  ],
  presentesRecebidosCentavos: 120000,
};

function contratoFake(): Contrato {
  return {
    id: 1,
    categoriaId: 1,
    categoriaNome: 'Buffet',
    fornecedorId: null,
    fornecedorNome: null,
    descricao: 'Buffet completo',
    valorContratadoCentavos: 100000,
    pagoCentavos: 0,
    parceladoCentavos: 40000,
    parcelas: [
      { id: 6, contratoId: 1, vencimento: '2027-03-01', valorCentavos: 40000, status: 'pendente', pagoEm: null, comprovanteArquivoId: null, atrasada: false },
    ],
  };
}

function api(opts: { falharDash?: boolean } = {}) {
  const estado = { contrato: contratoFake() };
  return ({ method, path, body }: { method: string; path: string; body: unknown }) => {
    if (path === '/painel/financeiro/dashboard') return opts.falharDash ? erro(500, 'X') : json(DASH);
    if (path === '/painel/financeiro/categorias' && method === 'GET') return json(DASH.categorias.map(({ id, nome, previstoCentavos }) => ({ id, nome, previstoCentavos })));
    if (path === '/painel/financeiro/categorias' && method === 'POST') return erro(409, 'CATEGORIA_DUPLICADA');
    if (path === '/painel/financeiro/contratos' && method === 'GET') return json([estado.contrato]);
    if (path === '/painel/fornecedores') return json([]);
    if (path === '/painel/financeiro/parcelas/6/pagar' && method === 'POST') {
      const { pagoEm } = body as { pagoEm: string };
      estado.contrato = {
        ...estado.contrato,
        pagoCentavos: 40000,
        parcelas: [{ ...estado.contrato.parcelas[0]!, status: 'pago', pagoEm }],
      };
      return json(estado.contrato);
    }
    if (path === '/painel/financeiro/contratos/1/parcelas/gerar' && method === 'POST') return json(estado.contrato, 201);
    return undefined;
  };
}

describe('Financeiro', () => {
  it('resumo mostra totais separados, atrasadas, próximos e presentes à parte', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/financeiro');
    const totais = await screen.findByLabelText('Totais');
    expect(within(totais).getByText('R$ 35.000,00')).toBeInTheDocument();
    expect(within(totais).getByText('R$ 25.000,00')).toBeInTheDocument();
    expect(within(totais).getByText('R$ 10.000,00')).toBeInTheDocument();
    // Nenhum valor somando os três.
    expect(screen.queryByText('R$ 70.000,00')).not.toBeInTheDocument();

    const atrasadas = screen.getByRole('heading', { name: 'Parcelas atrasadas' }).closest('section')!;
    expect(within(atrasadas).getByText(/31\/01\/2027/)).toBeInTheDocument();
    expect(screen.getByText(/15\/02\/2027/)).toBeInTheDocument();
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument();
  });

  it('erro no resumo mostra aviso', async () => {
    mockFetch({ logado: true, rotas: api({ falharDash: true }) });
    renderRoute('/painel/financeiro');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o resumo.');
  });

  it('categoria duplicada mostra aviso', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/financeiro');
    fireEvent.click(await screen.findByRole('tab', { name: 'Categorias' }));
    const form = await screen.findByRole('form', { name: 'Nova categoria' });
    fireEvent.change(within(form).getByLabelText('Nova categoria'), { target: { value: 'buffet' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Adicionar' }));
    expect(await within(form).findByRole('alert')).toHaveTextContent('Já existe uma categoria com esse nome.');
  });

  it('registra pagamento de parcela e gera o restante', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/financeiro');
    fireEvent.click(await screen.findByRole('tab', { name: 'Contratos e parcelas' }));
    const cartao = await screen.findByRole('article', { name: 'Contrato Buffet completo' });

    fireEvent.click(within(cartao).getByRole('button', { name: 'Registrar pagamento' }));
    fireEvent.change(within(cartao).getByLabelText('Pago em'), { target: { value: '2027-02-01' } });
    fireEvent.click(within(cartao).getByRole('button', { name: 'Confirmar pagamento' }));
    expect(await within(cartao).findByText('Pago em 01/02/2027')).toBeInTheDocument();

    const gerar = within(cartao).getByRole('form', { name: 'Gerar parcelas de Buffet completo' });
    expect(within(gerar).getByText('Falta parcelar R$ 600,00.')).toBeInTheDocument();
    fireEvent.change(within(gerar).getByLabelText('Parcelas'), { target: { value: '3' } });
    fireEvent.change(within(gerar).getByLabelText('Primeiro vencimento'), { target: { value: '2027-04-01' } });
    fireEvent.click(within(gerar).getByRole('button', { name: 'Gerar parcelas' }));
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/parcelas/gerar'));
      expect(JSON.parse(String(call![1]!.body))).toEqual({ quantidade: 3, primeiroVencimento: '2027-04-01', valorTotalCentavos: 60000 });
    });
  });
});
