import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';
import type { FornecedorDetalhe, StatusFornecedor } from './useFornecedores';

function detalheFake(extra: Partial<FornecedorDetalhe> = {}): FornecedorDetalhe {
  return {
    id: 1,
    nome: 'Buffet Sabor',
    categoria: 'Buffet',
    telefone: null,
    email: null,
    site: null,
    observacoes: null,
    status: 'orcado',
    responsavel: 'casal',
    contrato: null,
    menorOrcamentoCentavos: 750000,
    totalOrcamentos: 3,
    orcamentos: [
      { id: 11, descricao: 'Menu B', valorCentavos: 750000, data: '2027-01-10', arquivo: null },
      { id: 12, descricao: 'Menu C', valorCentavos: 820000, data: '2027-01-11', arquivo: null },
      { id: 13, descricao: 'Menu A', valorCentavos: 900000, data: '2027-01-09', arquivo: null },
    ],
    tarefas: [{ id: 5, titulo: 'Degustação' }],
    ...extra,
  };
}

const PROXIMOS: Record<StatusFornecedor, StatusFornecedor[]> = {
  pesquisando: ['orcado', 'descartado'],
  orcado: ['contratado', 'descartado'],
  contratado: ['descartado'],
  descartado: [],
};

function apiFornecedores() {
  const estado = { f: detalheFake() };
  const rotas = ({ method, path, search, body }: { method: string; path: string; search: string; body: unknown }) => {
    if (path === '/painel/fornecedores' && method === 'GET') {
      const status = new URLSearchParams(search).get('status');
      const lista = [estado.f, { ...detalheFake({ id: 2, nome: 'Foto Lux', categoria: 'Fotografia', status: 'pesquisando', totalOrcamentos: 0, menorOrcamentoCentavos: null }) }];
      return json(status ? lista.filter((f) => f.status === status) : lista);
    }
    if (path === '/painel/fornecedores/1' && method === 'GET') return json(estado.f);
    if (path === '/painel/fornecedores/1/status' && method === 'POST') {
      const { status } = body as { status: StatusFornecedor };
      if (!PROXIMOS[estado.f.status].includes(status)) return erro(409, 'TRANSICAO_INVALIDA');
      estado.f = { ...estado.f, status };
      return json(estado.f);
    }
    if (path === '/painel/fornecedores/1/orcamentos' && method === 'POST') {
      const o = body as { descricao: string; valorCentavos: number; data: string };
      estado.f = {
        ...estado.f,
        orcamentos: [...estado.f.orcamentos, { id: 99, arquivo: null, ...o }].sort((a, b) => a.valorCentavos - b.valorCentavos),
      };
      return json(estado.f, 201);
    }
    if (path === '/painel/fornecedores/1' && method === 'PUT') {
      estado.f = { ...estado.f, ...(body as object) };
      return json(estado.f);
    }
    return undefined;
  };
  return { estado, rotas };
}

describe('Fornecedores', () => {
  it('lista com badge de status e filtra por status', async () => {
    const { rotas } = apiFornecedores();
    const fetchMock = mockFetch({ logado: true, rotas });
    renderRoute('/painel/fornecedores');
    expect(await screen.findByText('Buffet Sabor')).toBeInTheDocument();
    expect(screen.getByText('Foto Lux')).toBeInTheDocument();
    expect(screen.getByText('3 orçamento(s) · menor R$ 7.500,00')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'orcado' } });
    await waitFor(() => expect(screen.queryByText('Foto Lux')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/painel/fornecedores?status=orcado', expect.anything());
  });

  it('erro ao carregar a lista mostra aviso', async () => {
    mockFetch({ logado: true, rotas: ({ path }) => (path === '/painel/fornecedores' ? erro(500, 'X') : undefined) });
    renderRoute('/painel/fornecedores');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os fornecedores.');
  });

  it('detalhe: orçamentos ordenados com o menor destacado e só transições válidas', async () => {
    const { rotas } = apiFornecedores();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/fornecedores/1');
    await screen.findByRole('heading', { name: 'Buffet Sabor', level: 1 });

    const linhas = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(linhas.map((l) => within(l).getAllByRole('cell')[0]!.textContent)).toEqual(['Menu B', 'Menu C', 'Menu A']);
    expect(screen.getByRole('row', { name: 'Menor orçamento' })).toHaveTextContent('Menu B');

    expect(screen.getByRole('button', { name: 'Marcar como contratado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como descartado' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como orçado' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como contratado' }));
    expect(await screen.findByRole('button', { name: 'Marcar como descartado' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Marcar como contratado' })).not.toBeInTheDocument());
    expect(screen.getByText('Degustação')).toBeInTheDocument();
  });

  it('adiciona orçamento com valor em reais convertido para centavos', async () => {
    const { rotas } = apiFornecedores();
    const fetchMock = mockFetch({ logado: true, rotas });
    renderRoute('/painel/fornecedores/1');
    const form = await screen.findByRole('form', { name: 'Novo orçamento' });
    fireEvent.change(within(form).getByLabelText('Descrição'), { target: { value: 'Menu econômico' } });
    fireEvent.change(within(form).getByLabelText('Valor (R$)'), { target: { value: '6.900,50' } });
    fireEvent.change(within(form).getByLabelText('Data'), { target: { value: '2027-02-01' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText('Menu econômico')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/orcamentos') && i?.method === 'POST');
    expect(JSON.parse(String(post![1]!.body))).toMatchObject({ valorCentavos: 690050, data: '2027-02-01' });
    expect(screen.getByRole('row', { name: 'Menor orçamento' })).toHaveTextContent('Menu econômico');
  });

  it('valor inválido avisa e não envia', async () => {
    const { rotas } = apiFornecedores();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/fornecedores/1');
    const form = await screen.findByRole('form', { name: 'Novo orçamento' });
    fireEvent.change(within(form).getByLabelText('Valor (R$)'), { target: { value: '12,345' } });
    expect(within(form).getByRole('alert')).toHaveTextContent('Valor inválido');
    expect(within(form).getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });

  it('fornecedor inexistente mostra aviso', async () => {
    mockFetch({ logado: true, rotas: ({ path }) => (path === '/painel/fornecedores/7' ? erro(404, 'FORNECEDOR_NOT_FOUND') : undefined) });
    renderRoute('/painel/fornecedores/7');
    expect(await screen.findByRole('alert')).toHaveTextContent('Fornecedor não encontrado');
  });
});
