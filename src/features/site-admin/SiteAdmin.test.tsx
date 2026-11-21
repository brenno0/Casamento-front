import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { json, mockFetch, renderRoute } from '../../test/renderRoute';
import { moverNaLista, type SitePainel } from './useSiteAdmin';

function painelFake(): SitePainel {
  return {
    locais: [
      { id: 1, tipo: 'cerimonia', nome: 'Cerimônia', data: '2027-07-17', horario: '16:00', endereco: '', latitude: null, longitude: null },
      { id: 2, tipo: 'festa', nome: 'Festa', data: '2027-07-17', horario: '18:30', endereco: '', latitude: null, longitude: null },
    ],
    config: { fotoCapaArquivoId: null, capaUrl: null, listasPresentes: [], dressCode: 'Traje social.', paleta: ['#c9a9a6'], rsvpPrazo: '2027-06-17', mensagemConvite: 'Oi {grupo}: {link}', mensagemLembrete: 'Lembra {grupo}: {link} até {prazo}' },
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
    if (path === '/painel/site/config' && method === 'PUT') {
      site = { ...site, config: { ...site.config, ...(body as object) } };
      return json(site);
    }
    const h = /^\/painel\/site\/historia\/(\d+)$/.exec(path);
    if (h && method === 'PUT') {
      site = { ...site, historia: site.historia.map((x) => (x.id === Number(h[1]) ? { ...x, ...(body as object) } : x)) };
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
    fireEvent.change(within(form).getByLabelText('Endereço'), { target: { value: 'Rua A, 10' } });
    fireEvent.change(within(form).getByLabelText('Latitude'), { target: { value: '-16,44' } });
    fireEvent.change(within(form).getByLabelText('Longitude'), { target: { value: '-39.06' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/painel/site/locais/cerimonia'));
      expect(JSON.parse(String(put![1]!.body))).toMatchObject({ endereco: 'Rua A, 10', latitude: -16.44, longitude: -39.06 });
    });
  });

  it('edita um capítulo da história com só mês e ano', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/site');
    fireEvent.click(await screen.findByRole('tab', { name: 'Nossa história' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]!);
    const form = screen.getByRole('form', { name: 'Editar Nos conhecemos' });
    fireEvent.click(within(form).getByLabelText('Só mês e ano'));
    fireEvent.change(within(form).getByLabelText('Texto'), { target: { value: 'Num show.' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/painel/site/historia/1') && i?.method === 'PUT');
      expect(JSON.parse(String(put![1]!.body))).toEqual({ data: '2019-03', titulo: 'Nos conhecemos', texto: 'Num show.' });
    });
  });

  it('cadastra duas listas de presentes externas', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api() });
    renderRoute('/painel/site');
    fireEvent.click(await screen.findByRole('tab', { name: 'Lista de presentes' }));
    const form = screen.getByRole('form', { name: 'Listas de presentes' });
    fireEvent.change(within(form).getByLabelText('Texto do botão'), { target: { value: 'Lista no iCasei' } });
    fireEvent.change(within(form).getByLabelText('Link'), { target: { value: 'https://sites.icasei.com.br/nb' } });
    fireEvent.click(within(form).getByRole('button', { name: '+ Outra lista' }));
    fireEvent.change(within(form).getAllByLabelText('Texto do botão')[1]!, { target: { value: 'Lua de mel' } });
    expect(within(form).getByRole('button', { name: 'Salvar' })).toBeDisabled();
    fireEvent.change(within(form).getAllByLabelText('Link')[1]!, { target: { value: 'https://exemplo.com/lua' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/painel/site/config') && i?.method === 'PUT');
      expect(JSON.parse(String(put![1]!.body))).toEqual({
        listasPresentes: [
          { titulo: 'Lista no iCasei', url: 'https://sites.icasei.com.br/nb' },
          { titulo: 'Lua de mel', url: 'https://exemplo.com/lua' },
        ],
      });
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
