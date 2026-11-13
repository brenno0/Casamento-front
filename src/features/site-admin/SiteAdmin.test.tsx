import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { json, mockFetch, renderRoute } from '../../test/renderRoute';
import { moverNaLista, type SitePainel } from './useSiteAdmin';

function painelFake(): SitePainel {
  return {
    locais: [
      { id: 1, tipo: 'cerimonia', nome: 'Cerimônia', data: '2027-07-17', horario: '16:00', endereco: '', latitude: null, longitude: null },
      { id: 2, tipo: 'festa', nome: 'Festa', data: '2027-07-17', horario: '18:30', endereco: '', latitude: null, longitude: null },
    ],
    config: { dressCode: 'Traje social.', paleta: ['#c9a9a6'] },
    historia: [
      { id: 1, data: '2019-03-10', titulo: 'Nos conhecemos', texto: '', fotoArquivoId: null, fotoUrl: null },
      { id: 2, data: '2024-12-24', titulo: 'Pedido', texto: '', fotoArquivoId: null, fotoUrl: null },
    ],
    galeria: [],
    faq: [],
  };
}

function api() {
  let site = painelFake();
  return ({ method, path, body }: { method: string; path: string; body: unknown }) => {
    if (path === '/painel/site' && method === 'GET') return json(site);
    const m = /^\/painel\/site\/locais\/(\w+)$/.exec(path);
    if (m && method === 'PUT') {
      site = { ...site, locais: site.locais.map((l) => (l.tipo === m[1] ? { ...l, ...(body as object) } : l)) };
      return json(site);
    }
    if (path === '/painel/site/historia/ordem' && method === 'PUT') {
      const { ids } = body as { ids: number[] };
      site = { ...site, historia: ids.map((id) => site.historia.find((h) => h.id === id)!) };
      return json(site);
    }
    return undefined;
  };
}

describe('Site no painel', () => {
  it('salva endereço e coordenadas de um local (vírgula aceita)', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/site');
    const form = await screen.findByRole('form', { name: 'Local Cerimônia' });
    fireEvent.change(within(form).getByLabelText('Endereço (só no convite)'), { target: { value: 'Rua A, 10' } });
    fireEvent.change(within(form).getByLabelText('Latitude'), { target: { value: '-16,44' } });
    fireEvent.change(within(form).getByLabelText('Longitude'), { target: { value: '-39.06' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/painel/site/locais/cerimonia'));
      expect(JSON.parse(String(put![1]!.body))).toMatchObject({ endereco: 'Rua A, 10', latitude: -16.44, longitude: -39.06 });
    });
  });

  it('coordenada inválida desabilita o salvar', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/site');
    const form = await screen.findByRole('form', { name: 'Local Festa' });
    fireEvent.change(within(form).getByLabelText('Latitude'), { target: { value: '120' } });
    expect(within(form).getByRole('alert')).toHaveTextContent('Coordenadas inválidas.');
    expect(within(form).getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('reordena a história', async () => {
    mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/site');
    fireEvent.click(await screen.findByRole('tab', { name: 'Nossa história' }));
    const pedido = (await screen.findByText('Pedido')).closest('li')!;
    fireEvent.click(within(pedido).getByRole('button', { name: 'Subir' }));
    await waitFor(() => {
      const lista = screen.getByText('Pedido').closest('ul')!;
      expect(within(lista).getAllByRole('listitem')[0]).toHaveTextContent('Pedido');
    });
  });

  it('moverNaLista troca vizinhos e ignora bordas', () => {
    expect(moverNaLista([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moverNaLista([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});
