import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';
import type { Convidado, Grupo } from './useConvidados';

function conv(id: number, grupoId: number, nome: string, extra: Partial<Convidado> = {}): Convidado {
  return {
    id,
    grupoId,
    nome,
    tipo: 'adulto',
    lado: 'ambos',
    funcao: null,
    telefone: null,
    email: null,
    acompanhantePermitido: false,
    acompanhanteNome: null,
    rsvp: 'sem_resposta',
    rsvpEm: null,
    ...extra,
  };
}

function api() {
  const estado: { grupos: Grupo[]; proximo: number } = {
    proximo: 100,
    grupos: [
      {
        id: 1,
        nome: 'Família Souza',
        token: 'tok1',
        mensagem: null,
        statusEnvio: 'nao_enviado',
        convidados: [conv(1, 1, 'Pai', { lado: 'noivo' }), conv(2, 1, 'Filha', { tipo: 'crianca', funcao: 'dama', rsvp: 'vai' })],
      },
      { id: 2, nome: 'Carlos', token: 'tok2', mensagem: null, statusEnvio: 'nao_enviado', convidados: [conv(3, 2, 'Carlos', { funcao: 'padrinho', lado: 'noiva' })] },
    ],
  };
  const rotas = ({ method, path, search, body }: { method: string; path: string; search: string; body: unknown }) => {
    if (path === '/painel/grupos' && method === 'GET') {
      const busca = new URLSearchParams(search).get('busca')?.toLowerCase();
      return json(busca ? estado.grupos.filter((g) => g.nome.toLowerCase().includes(busca)) : estado.grupos);
    }
    if (path === '/painel/convidados/resumo') {
      return json({
        pessoas: 3, convidados: 3, acompanhantes: 0, adultos: 2, criancas: 1, grupos: 2,
        porLado: { noivo: 1, noiva: 1, ambos: 1 },
        porRsvp: { sem_resposta: 2, vai: 1, nao_vai: 0 },
        porFuncao: { padrinho: 1, madrinha: 0, dama: 1, pajem: 0 },
      });
    }
    if (path === '/painel/convidados' && method === 'POST') {
      const d = body as Partial<Convidado> & { nome: string };
      const id = estado.proximo++;
      let grupoId = d.grupoId;
      if (!grupoId) {
        grupoId = estado.proximo++;
        estado.grupos.push({ id: grupoId, nome: d.nome, token: `t${grupoId}`, mensagem: null, statusEnvio: 'nao_enviado', convidados: [] });
      }
      const novo = conv(id, grupoId, d.nome, d);
      estado.grupos.find((g) => g.id === grupoId)!.convidados.push(novo);
      return json(novo, 201);
    }
    const m = /^\/painel\/convidados\/(\d+)$/.exec(path);
    if (m && method === 'PUT') {
      const id = Number(m[1]);
      const d = body as Partial<Convidado>;
      const origem = estado.grupos.find((g) => g.convidados.some((c) => c.id === id))!;
      const atual = origem.convidados.find((c) => c.id === id)!;
      const novo = { ...atual, ...d };
      origem.convidados = origem.convidados.filter((c) => c.id !== id);
      estado.grupos.find((g) => g.id === novo.grupoId)!.convidados.push(novo);
      return json(novo);
    }
    const g = /^\/painel\/grupos\/(\d+)$/.exec(path);
    if (g && method === 'DELETE') {
      const alvo = estado.grupos.find((x) => x.id === Number(g[1]))!;
      if (alvo.convidados.length) return erro(409, 'GRUPO_NAO_VAZIO');
      estado.grupos = estado.grupos.filter((x) => x !== alvo);
      return new Response(null, { status: 204 });
    }
    return undefined;
  };
  return { estado, rotas };
}

describe('Convidados', () => {
  it('mostra resumo e grupos com badges', async () => {
    mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    const resumo = await screen.findByLabelText('Resumo');
    expect(within(resumo).getByText('Pessoas').nextSibling).toHaveTextContent('3');
    const familia = await screen.findByRole('article', { name: 'Grupo Família Souza' });
    expect(within(familia).getByText('Dama')).toBeInTheDocument();
    expect(within(familia).getByText('Vai')).toBeInTheDocument();
  });

  it('filtro por função mostra só grupos com alguém daquela função', async () => {
    mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    await screen.findByRole('article', { name: 'Grupo Carlos' });
    fireEvent.change(screen.getByLabelText('Função'), { target: { value: 'padrinho' } });
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Grupo Família Souza' })).not.toBeInTheDocument());
    expect(screen.getByRole('article', { name: 'Grupo Carlos' })).toBeInTheDocument();
  });

  it('cria convidado solo (sem grupoId) e o grupo dele aparece', async () => {
    const fetchMock = mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    await screen.findByRole('article', { name: 'Grupo Carlos' });
    fireEvent.click(screen.getByRole('button', { name: 'Novo convidado' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo convidado' });
    fireEvent.change(within(dialog).getByLabelText('Nome'), { target: { value: 'Lia Madrinha' } });
    fireEvent.change(within(dialog).getByLabelText('Função'), { target: { value: 'madrinha' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('article', { name: 'Grupo Lia Madrinha' })).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/painel/convidados') && i?.method === 'POST');
    const enviado = JSON.parse(String(post![1]!.body)) as Record<string, unknown>;
    expect(enviado).not.toHaveProperty('grupoId');
    expect(enviado).toMatchObject({ nome: 'Lia Madrinha', funcao: 'madrinha' });
  });

  it('move convidado para outro grupo', async () => {
    mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    const familia = await screen.findByRole('article', { name: 'Grupo Família Souza' });
    fireEvent.click(within(familia).getByRole('button', { name: 'Pai' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar convidado' });
    fireEvent.change(within(dialog).getByLabelText('Grupo'), { target: { value: '2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    const carlos = screen.getByRole('article', { name: 'Grupo Carlos' });
    expect(await within(carlos).findByRole('button', { name: 'Pai' })).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Grupo Família Souza' })).queryByRole('button', { name: 'Pai' })).not.toBeInTheDocument();
  });

  it('excluir grupo com convidados avisa', async () => {
    mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    const carlos = await screen.findByRole('article', { name: 'Grupo Carlos' });
    fireEvent.click(within(carlos).getByRole('button', { name: 'Editar grupo' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar grupo' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir grupo' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Mova ou exclua os convidados');
  });

  it('erro ao carregar mostra aviso', async () => {
    mockFetch({ logado: true, rotas: ({ path }) => (path === '/painel/grupos' ? erro(500, 'X') : undefined) });
    renderRoute('/painel/convidados');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os convidados.');
  });
});
