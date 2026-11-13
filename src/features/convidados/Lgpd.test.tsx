import { fireEvent, screen, within } from '@testing-library/react';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';

function api(opts: { antes?: boolean } = {}) {
  let limpoEm: string | null = null;
  return ({ method, path }: { method: string; path: string }) => {
    if (path === '/painel/grupos') return json([]);
    if (path === '/painel/convidados/lgpd') return json({ limpoEm, automaticaEm: '2027-08-16' });
    if (path === '/painel/convidados/limpeza-lgpd' && method === 'POST') {
      if (opts.antes) return erro(409, 'LIMPEZA_ANTES_DO_CASAMENTO');
      limpoEm = '2027-07-20T15:00:00.000Z';
      return json({ limpoEm, automaticaEm: '2027-08-16' });
    }
    return undefined;
  };
}

describe('LGPD no painel', () => {
  it('mostra a data automática e apaga só com a palavra digitada', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/convidados');
    const cartao = (await screen.findByRole('heading', { name: /LGPD/ })).closest('section')!;
    expect(within(cartao).getByText(/16\/08\/2027/)).toBeInTheDocument();
    fireEvent.click(within(cartao).getByRole('button', { name: /Apagar contatos agora…/ }));
    const apagar = within(cartao).getByRole('button', { name: 'Apagar contatos agora' });
    expect(apagar).toBeDisabled();
    fireEvent.change(within(cartao).getByLabelText(/Digite APAGAR/), { target: { value: 'APAGAR' } });
    fireEvent.click(apagar);
    expect(await within(cartao).findByText(/apagados em/)).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/limpeza-lgpd'));
    expect(JSON.parse(String(post![1]!.body))).toEqual({ confirmacao: 'APAGAR' });
  });

  it('antes do casamento avisa', async () => {
    mockFetch({ logado: true, rotas: api({ antes: true }) });
    renderRoute('/painel/convidados');
    const cartao = (await screen.findByRole('heading', { name: /LGPD/ })).closest('section')!;
    fireEvent.click(within(cartao).getByRole('button', { name: /Apagar contatos agora…/ }));
    fireEvent.change(within(cartao).getByLabelText(/Digite APAGAR/), { target: { value: 'APAGAR' } });
    fireEvent.click(within(cartao).getByRole('button', { name: 'Apagar contatos agora' }));
    expect(await within(cartao).findByRole('alert')).toHaveTextContent('Só é possível apagar depois do casamento.');
  });

  it('presentes recebidos tem link de export CSV', async () => {
    mockFetch({ logado: true, rotas: ({ path }) => (path.startsWith('/painel/presentes') ? json([]) : undefined) });
    renderRoute('/painel/presentes');
    fireEvent.click(await screen.findByRole('tab', { name: 'Presentes recebidos' }));
    expect(await screen.findByRole('link', { name: 'Exportar doações (CSV)' })).toHaveAttribute('href', '/api/painel/presentes/export.csv');
  });
});
