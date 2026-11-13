import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { json, mockFetch, renderRoute } from '../../test/renderRoute';
import type { ViagemDetalhe } from './useViagens';

function luaDeMel(): ViagemDetalhe {
  return {
    id: 1,
    nome: "Lua de mel — Arraial d'Ajuda",
    destino: "Arraial d'Ajuda, BA",
    dataInicio: '2027-07-18',
    dataFim: '2027-07-25',
    roteiro: [{ id: 1, data: '2027-07-18', horario: '14:00', titulo: 'Check-in', descricao: '', local: 'Pousada' }],
    reservas: [
      { id: 1, tipo: 'hospedagem', descricao: 'Pacote lua de mel', codigo: 'ABC123', data: '2027-07-18', voucherArquivoId: 9, valorCentavos: 800000, statusPagamento: 'pago', categoriaFinanceiraId: 8, contratoId: 3 },
    ],
    mala: [
      { id: 1, categoria: 'Praia', descricao: 'Biquíni', dono: 'noiva', naMala: false },
      { id: 2, categoria: 'Praia', descricao: 'Sunga', dono: 'noivo', naMala: true },
    ],
    progressoMala: { noivo: { total: 1, naMala: 1 }, noiva: { total: 1, naMala: 0 }, ambos: { total: 0, naMala: 0 } },
  };
}

function api() {
  let v = luaDeMel();
  return ({ method, path, body }: { method: string; path: string; body: unknown }) => {
    if (path === '/painel/viagens' && method === 'GET') return json([{ id: 1, nome: v.nome, destino: v.destino, dataInicio: v.dataInicio, dataFim: v.dataFim }]);
    if (path === '/painel/viagens/1' && method === 'GET') return json(v);
    if (path === '/painel/viagens/1/mala/1' && method === 'PUT') {
      const { naMala } = body as { naMala: boolean };
      v = { ...v, mala: v.mala.map((m) => (m.id === 1 ? { ...m, naMala } : m)), progressoMala: { ...v.progressoMala, noiva: { total: 1, naMala: naMala ? 1 : 0 } } };
      return json(v);
    }
    if (path === '/painel/financeiro/categorias') return json([{ id: 8, nome: 'Lua de mel', previstoCentavos: 0 }]);
    return undefined;
  };
}

describe('viagens', () => {
  it('lista a lua de mel e abre o detalhe com roteiro', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/viagens');
    fireEvent.click(await screen.findByRole('link', { name: /Lua de mel/ }));
    expect(await screen.findByRole('heading', { level: 1, name: /Lua de mel/ })).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
  });

  it('reserva mostra código grande, voucher e status pago no financeiro', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/viagens/1');
    fireEvent.click(await screen.findByRole('tab', { name: 'Reservas' }));
    const r = screen.getByRole('article', { name: 'Reserva Pacote lua de mel' });
    expect(within(r).getByText('ABC123')).toBeInTheDocument();
    expect(within(r).getByRole('link', { name: 'Abrir voucher' })).toHaveAttribute('href', '/api/painel/arquivos/9');
    expect(within(r).getByText('Pago')).toBeInTheDocument();
    expect(within(r).getByText('no financeiro')).toBeInTheDocument();
  });

  it('marca item na mala e o progresso por dono atualiza', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/viagens/1');
    fireEvent.click(await screen.findByRole('tab', { name: 'Mala' }));
    const progresso = screen.getByRole('list', { name: 'Progresso da mala' });
    expect(within(progresso).getByText('Noiva: 0/1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Biquíni/ }));
    await waitFor(() => expect(within(progresso).getByText('Noiva: 1/1')).toBeInTheDocument());
  });

  it('nova viagem com fim antes do início avisa', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/viagens');
    const form = await screen.findByRole('form', { name: 'Nova viagem' });
    fireEvent.change(within(form).getByLabelText('Nome'), { target: { value: 'X' } });
    fireEvent.change(within(form).getByLabelText('Início'), { target: { value: '2027-09-05' } });
    fireEvent.change(within(form).getByLabelText('Fim'), { target: { value: '2027-09-01' } });
    expect(within(form).getByRole('alert')).toHaveTextContent('O fim precisa ser no início ou depois.');
    expect(within(form).getByRole('button', { name: 'Criar viagem' })).toBeDisabled();
  });
});
