import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { json, mockFetch, renderRoute, TOKEN_FAKE } from '../../test/renderRoute';
import type { Recado } from './MuralSection';

function api() {
  const recados: Recado[] = [{ id: 1, autorNome: 'Tio', texto: 'Parabéns!', criadoEm: '2027-07-01T12:00:00.000Z' }];
  return ({ method, path, body }: { method: string; path: string; body: unknown }) => {
    if (path === `/convite/${TOKEN_FAKE}/mural` && method === 'GET') return json({ recados: [...recados].reverse(), temMais: false });
    if (path === `/convite/${TOKEN_FAKE}/mural` && method === 'POST') {
      const b = body as { autorNome: string; texto: string };
      const r = { id: recados.length + 1, autorNome: b.autorNome, texto: b.texto, criadoEm: '2027-07-02T12:00:00.000Z' };
      recados.push(r);
      return json(r, 201);
    }
    return undefined;
  };
}

describe('mural', () => {
  beforeEach(() => sessionStorage.setItem(`envelope-aberto:${TOKEN_FAKE}`, '1'));

  it('recado publicado aparece no topo; HTML aparece como texto', async () => {
    mockFetch({ rotas: api() });
    renderRoute(`/c/${TOKEN_FAKE}`);
    const form = await screen.findByRole('form', { name: 'Deixar um recado' });
    expect(within(form).getByLabelText('Seu nome')).toHaveValue('Família Souza');
    fireEvent.change(within(form).getByLabelText('Recado para o casal'), { target: { value: '<b>Viva</b> os noivos' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Publicar' }));
    const lista = screen.getByRole('list', { name: 'Recados' });
    await waitFor(() => expect(within(lista).getAllByRole('listitem')[0]).toHaveTextContent('<b>Viva</b> os noivos'));
    expect(within(lista).getAllByRole('listitem')[1]).toHaveTextContent('Parabéns!');
    expect(lista.querySelector('b')).toBeNull();
  });

  it('site público não mostra mural', async () => {
    mockFetch();
    renderRoute('/');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('form', { name: 'Deixar um recado' })).not.toBeInTheDocument();
  });

  it('painel exclui recado após confirmar', async () => {
    let lista = [{ id: 1, autorNome: 'Tio', texto: 'Parabéns!', criadoEm: '2027-07-01T12:00:00.000Z', grupoNome: 'Família' }];
    mockFetch({
      logado: true,
      rotas: ({ method, path }) => {
        if (path === '/painel/mural' && method === 'GET') return json({ recados: lista, temMais: false });
        if (path === '/painel/mural/1' && method === 'DELETE') {
          lista = [];
          return new Response(null, { status: 204 });
        }
        return undefined;
      },
    });
    renderRoute('/painel/mural');
    const item = await screen.findByRole('listitem', { name: 'Recado de Tio' });
    fireEvent.click(within(item).getByRole('button', { name: 'Excluir' }));
    fireEvent.click(within(item).getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await screen.findByText('Nenhum recado ainda.')).toBeInTheDocument();
  });
});
