import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';
import type { Contrato, Dashboard } from './useFinanceiro';

const DASH: Dashboard = {
  hoje: '2027-02-01',
  categorias: [
    { id: 1, nome: 'Buffet', previstoCentavos: 3000000, contratadoCentavos: 2500000, pagoCentavos: 1000000 },
    { id: 2, nome: 'Música', previstoCentavos: 500000, contratadoCentavos: 0, pagoCentavos: 0 },
  ],
  totais: { previstoCentavos: 3500000, contratadoCentavos: 2500000, pagoCentavos: 1000000, faltaPagarCentavos: 1500000, estimadoCentavos: 2800000, reservadoCentavos: 2000000 },
  reservas: [
    { id: 1, titular: 'Brenno', valorCentavos: 1200000, atualizadoEm: null },
    { id: 2, titular: 'Nayane', valorCentavos: 800000, atualizadoEm: null },
  ],
  porFornecedor: [
    { fornecedorId: 4, nome: 'Buffet Sabor', contratadoCentavos: 2500000, pagoCentavos: 1000000, estimadoCentavos: null },
    { fornecedorId: 6, nome: 'DJ Som', contratadoCentavos: 0, pagoCentavos: 0, estimadoCentavos: 300000 },
  ],
  fornecedoresSemContrato: [{ id: 5, nome: 'Foto Lux' }],
  proximosVencimentos: [
    { id: 7, contratoId: 1, vencimento: '2027-02-15', valorCentavos: 50000, status: 'pendente', pagoEm: null, comprovanteArquivoId: null, atrasada: false, contratoDescricao: 'Buffet completo', categoriaNome: 'Buffet' },
  ],
  atrasadas: [
    { id: 6, contratoId: 1, vencimento: '2027-01-31', valorCentavos: 70000, status: 'pendente', pagoEm: null, comprovanteArquivoId: null, atrasada: true, contratoDescricao: 'Buffet completo', categoriaNome: 'Buffet' },
  ],
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
    viagemId: null,
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
    if (path === '/painel/financeiro/contratos/1' && method === 'PUT') {
      estado.contrato = { ...estado.contrato, ...(body as object) };
      return json(estado.contrato);
    }
    if (path === '/painel/financeiro/parcelas/6' && method === 'PUT') return erro(400, 'PARCELAS_EXCEDEM_CONTRATO');
    return undefined;
  };
}

describe('Financeiro', () => {
  it('resumo mostra totais separados, atrasadas, próximos, reservas e o que sobra', async () => {
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
    expect(within(totais).getByText('Sobra depois de pagar tudo').nextSibling).toHaveTextContent('R$ 2.000,00');
    expect(within(totais).getByText('Estimado (com cotações)').nextSibling).toHaveTextContent('R$ 28.000,00');
    expect(screen.getByRole('link', { name: 'DJ Som' }).closest('tr')).toHaveTextContent('R$ 3.000,00');
    expect(screen.getByLabelText('Reservado por Brenno')).toHaveValue('12000,00');
    expect(screen.getByRole('link', { name: 'Buffet Sabor' })).toHaveAttribute('href', '/painel/fornecedores/4');
    expect(screen.getByRole('link', { name: 'Foto Lux' })).toHaveAttribute('href', '/painel/fornecedores/5');
  });

  it('editar o reservado de alguém salva ao sair do campo', async () => {
    const fetchMock = mockFetch({
      logado: true,
      rotas: (r) => (r.path === '/painel/financeiro/reservas/2' && r.method === 'PUT' ? json(DASH.reservas) : api()(r)),
    });
    renderRoute('/painel/financeiro');
    const campo = await screen.findByLabelText('Reservado por Nayane');
    fireEvent.change(campo, { target: { value: '9500,50' } });
    fireEvent.blur(campo);
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/painel/financeiro/reservas/2') && i?.method === 'PUT');
      expect(JSON.parse(String(put![1]!.body))).toEqual({ valorCentavos: 950050 });
    });
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

  it('edita descrição e valor do contrato', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/financeiro');
    fireEvent.click(await screen.findByRole('tab', { name: 'Contratos e parcelas' }));
    const cartao = await screen.findByRole('article', { name: 'Contrato Buffet completo' });
    fireEvent.click(within(cartao).getByRole('button', { name: 'Editar' }));
    const form = within(cartao).getByRole('form', { name: 'Editar contrato Buffet completo' });
    fireEvent.change(within(form).getByLabelText('Descrição'), { target: { value: 'Buffet com bar' } });
    fireEvent.change(within(form).getByLabelText('Valor contratado (R$)'), { target: { value: '1500,00' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/painel/financeiro/contratos/1') && i?.method === 'PUT');
      expect(JSON.parse(String(put![1]!.body))).toMatchObject({ descricao: 'Buffet com bar', valorContratadoCentavos: 150000 });
    });
  });

  it('parcela que passaria do contrato mostra o motivo', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/financeiro');
    fireEvent.click(await screen.findByRole('tab', { name: 'Contratos e parcelas' }));
    const cartao = await screen.findByRole('article', { name: 'Contrato Buffet completo' });
    fireEvent.click(within(cartao).getByRole('button', { name: 'Editar parcela' }));
    const form = within(cartao).getByRole('form', { name: 'Editar parcela' });
    fireEvent.change(within(form).getByLabelText('Valor (R$)'), { target: { value: '5000' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar parcela' }));
    expect(await within(form).findByRole('alert')).toHaveTextContent('PARCELAS_EXCEDEM_CONTRATO');
  });
});
