import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { erro, json, mockFetch, renderRoute } from '../../test/renderRoute';
import { moverNoQuadro, type Quadro, type Tarefa } from './useTarefas';

const HOJE = '2027-03-01';

function tarefaFake(id: number, colunaId: number, ordem: number, extra: Partial<Tarefa> = {}): Tarefa {
  return {
    id,
    colunaId,
    titulo: `Tarefa ${id}`,
    descricao: null,
    prazo: null,
    responsavel: 'ambos',
    ordem,
    fornecedorId: null,
    fornecedorNome: null,
    ...extra,
  };
}

function quadroFake(): Quadro {
  return {
    hoje: HOJE,
    colunas: [
      {
        id: 1,
        nome: 'A fazer',
        ordem: 0,
        concluida: false,
        tarefas: [
          tarefaFake(10, 1, 0, { titulo: 'Reservar o local da festa', prazo: '2026-08-01', responsavel: 'noiva' }),
          tarefaFake(11, 1, 1, { titulo: 'Contratar fotografia', prazo: '2027-03-03' }),
        ],
      },
      { id: 2, nome: 'Fazendo', ordem: 1, concluida: false, tarefas: [] },
      {
        id: 3,
        nome: 'Feito',
        ordem: 2,
        concluida: true,
        tarefas: [tarefaFake(12, 3, 0, { titulo: 'Definir o orçamento', prazo: '2026-07-17' })],
      },
    ],
  };
}

/** API fake de tarefas sobre um quadro em memória (filtros e criação como o servidor). */
function apiTarefas(opts: { falharGet?: boolean; falharMover?: boolean } = {}) {
  const estado = { quadro: quadroFake(), proximoId: 100 };
  const rotas = ({ method, path, search, body }: { method: string; path: string; search: string; body: unknown }) => {
    if (path === '/painel/tarefas' && method === 'GET') {
      if (opts.falharGet) return erro(500, 'INTERNAL_ERROR');
      const filtro = new URLSearchParams(search).get('filtro') ?? 'todas';
      const { quadro } = estado;
      if (filtro === 'todas') return json(quadro);
      return json({
        ...quadro,
        colunas: quadro.colunas.map((c) => ({
          ...c,
          tarefas: c.concluida
            ? []
            : c.tarefas.filter(
                (t) =>
                  t.prazo !== null &&
                  (filtro === 'atrasadas' ? t.prazo < HOJE : t.prazo >= HOJE && t.prazo <= '2027-03-07'),
              ),
        })),
      });
    }
    if (path === '/painel/tarefas' && method === 'POST') {
      const dados = body as Omit<Tarefa, 'id' | 'ordem'>;
      const coluna = estado.quadro.colunas.find((c) => c.id === dados.colunaId);
      if (!coluna) return erro(404, 'COLUNA_NOT_FOUND');
      const nova = { ...tarefaFake(estado.proximoId++, coluna.id, coluna.tarefas.length), ...dados };
      coluna.tarefas.push(nova);
      return json(nova, 201);
    }
    const mover = /^\/painel\/tarefas\/(\d+)\/mover$/.exec(path);
    if (mover && method === 'POST') {
      if (opts.falharMover) return erro(500, 'INTERNAL_ERROR');
      const vars = body as { colunaId: number; ordem: number };
      estado.quadro = moverNoQuadro(estado.quadro, { id: Number(mover[1]), ...vars });
      return json(estado.quadro.colunas.flatMap((c) => c.tarefas).find((t) => t.id === Number(mover[1])));
    }
    const tarefaPath = /^\/painel\/tarefas\/(\d+)$/.exec(path);
    if (tarefaPath) {
      const id = Number(tarefaPath[1]);
      const dona = estado.quadro.colunas.find((c) => c.tarefas.some((t) => t.id === id));
      if (!dona) return erro(404, 'TAREFA_NOT_FOUND');
      if (method === 'PUT') {
        const i = dona.tarefas.findIndex((t) => t.id === id);
        dona.tarefas[i] = { ...dona.tarefas[i]!, ...(body as Partial<Tarefa>) };
        return json(dona.tarefas[i]);
      }
      if (method === 'DELETE') {
        dona.tarefas = dona.tarefas.filter((t) => t.id !== id);
        return new Response(null, { status: 204 });
      }
    }
    const coluna = /^\/painel\/tarefas\/colunas\/(\d+)$/.exec(path);
    if (coluna && method === 'DELETE') {
      const alvo = estado.quadro.colunas.find((c) => c.id === Number(coluna[1]));
      if (!alvo) return erro(404, 'COLUNA_NOT_FOUND');
      if (alvo.tarefas.length > 0) return erro(409, 'COLUNA_NAO_VAZIA');
      estado.quadro.colunas = estado.quadro.colunas.filter((c) => c !== alvo);
      return new Response(null, { status: 204 });
    }
    if (coluna && method === 'PUT') {
      const alvo = estado.quadro.colunas.find((c) => c.id === Number(coluna[1]));
      if (!alvo) return erro(404, 'COLUNA_NOT_FOUND');
      const dados = body as { nome?: string; concluida?: boolean };
      if (dados.nome !== undefined) alvo.nome = dados.nome;
      if (dados.concluida !== undefined) {
        if (!dados.concluida && estado.quadro.colunas.filter((c) => c.concluida).length <= 1) {
          return erro(409, 'ULTIMA_COLUNA_CONCLUIDA');
        }
        alvo.concluida = dados.concluida;
      }
      return json({ id: alvo.id, nome: alvo.nome, ordem: alvo.ordem, concluida: alvo.concluida });
    }
    return undefined;
  };
  return { estado, rotas };
}

const coluna = (nome: string) => screen.getByRole('region', { name: nome });

describe('TarefasPage', () => {
  it('mostra as três colunas com os cartões, prazo, responsável e badge de atrasada', async () => {
    const { rotas } = apiTarefas();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');

    expect(await screen.findByRole('heading', { name: 'Tarefas', level: 1 })).toBeInTheDocument();
    await screen.findByText('Reservar o local da festa');
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
      'A fazer',
      'Fazendo',
      'Feito',
    ]);

    const aFazer = coluna('A fazer');
    const atrasado = within(aFazer).getByText('Reservar o local da festa').closest('article')!;
    expect(within(atrasado).getByText('01/08/2026')).toBeInTheDocument();
    expect(within(atrasado).getByText('Noiva')).toBeInTheDocument();
    expect(within(atrasado).getByText('Atrasada')).toBeInTheDocument();

    const emDia = within(aFazer).getByText('Contratar fotografia').closest('article')!;
    expect(within(emDia).queryByText('Atrasada')).not.toBeInTheDocument();

    // Em coluna concluída, prazo vencido não é "atrasada".
    const feito = coluna('Feito');
    expect(within(feito).getByText('Definir o orçamento')).toBeInTheDocument();
    expect(within(feito).queryByText('Atrasada')).not.toBeInTheDocument();
    expect(within(coluna('Fazendo')).getByText('Nada aqui.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mover Contratar fotografia' })).toBeInTheDocument();
  });

  it('filtro Atrasadas busca com ?filtro=atrasadas e mostra só as atrasadas', async () => {
    const { rotas } = apiTarefas();
    const fetchMock = mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    await screen.findByText('Contratar fotografia');

    fireEvent.click(screen.getByRole('button', { name: 'Atrasadas' }));
    await waitFor(() => expect(screen.queryByText('Contratar fotografia')).not.toBeInTheDocument());
    expect(await screen.findByText('Reservar o local da festa')).toBeInTheDocument();
    expect(screen.queryByText('Definir o orçamento')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atrasadas' })).toHaveAttribute('aria-pressed', 'true');
    expect(fetchMock).toHaveBeenCalledWith('/api/painel/tarefas?filtro=atrasadas', expect.anything());
    // Visão filtrada não permite arrastar.
    expect(screen.queryByRole('button', { name: /^Mover / })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Esta semana' }));
    await waitFor(() => expect(screen.queryByText('Reservar o local da festa')).not.toBeInTheDocument());
    expect(screen.getByText('Contratar fotografia')).toBeInTheDocument();
  });

  it('cria uma tarefa pelo modal e ela aparece na coluna', async () => {
    const { rotas } = apiTarefas();
    const fetchMock = mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    await screen.findByText('Contratar fotografia');

    fireEvent.click(screen.getByRole('button', { name: 'Nova tarefa em Fazendo' }));
    const dialog = screen.getByRole('dialog', { name: 'Nova tarefa' });
    const criar = within(dialog).getByRole('button', { name: 'Criar tarefa' });
    expect(criar).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: '  Provar bolo  ' } });
    fireEvent.change(within(dialog).getByLabelText('Prazo'), { target: { value: '2027-04-10' } });
    fireEvent.change(within(dialog).getByLabelText('Responsável'), { target: { value: 'noivo' } });
    fireEvent.click(criar);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/painel/tarefas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          titulo: 'Provar bolo',
          descricao: null,
          prazo: '2027-04-10',
          responsavel: 'noivo',
          fornecedorId: null,
          colunaId: 2,
        }),
      }),
    );
    const fazendo = coluna('Fazendo');
    expect(await within(fazendo).findByText('Provar bolo')).toBeInTheDocument();
    expect(within(fazendo).getByText('10/04/2027')).toBeInTheDocument();
    expect(within(fazendo).getByText('Noivo')).toBeInTheDocument();
  });

  it('erro ao criar mantém o modal aberto com mensagem', async () => {
    const { rotas } = apiTarefas();
    mockFetch({
      logado: true,
      rotas: (req) =>
        req.method === 'POST' && req.path === '/painel/tarefas' ? erro(500, 'INTERNAL_ERROR') : rotas(req),
    });
    renderRoute('/painel/tarefas');
    await screen.findByText('Contratar fotografia');

    fireEvent.click(screen.getByRole('button', { name: 'Nova tarefa' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: 'X' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar tarefa' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Não foi possível salvar agora');
  });

  it('excluir coluna com tarefas mostra o aviso de coluna não vazia', async () => {
    const { rotas } = apiTarefas();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    await screen.findByText('Contratar fotografia');

    fireEvent.click(screen.getByRole('button', { name: 'Excluir coluna A fazer' }));
    fireEvent.click(within(coluna('A fazer')).getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await within(coluna('A fazer')).findByRole('alert')).toHaveTextContent(
      'Esvazie a coluna antes de excluí-la.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir coluna Fazendo' }));
    // Nada é excluído antes da confirmação.
    expect(coluna('Fazendo')).toBeInTheDocument();
    fireEvent.click(within(coluna('Fazendo')).getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Fazendo' })).not.toBeInTheDocument());
  });

  it('edita a tarefa: limpa o prazo (envia null) e muda de coluna', async () => {
    const { rotas, estado } = apiTarefas();
    const fetchMock = mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    fireEvent.click(await screen.findByText('Contratar fotografia'));

    const dialog = await screen.findByRole('dialog', { name: 'Editar tarefa' });
    fireEvent.change(within(dialog).getByLabelText('Prazo'), { target: { value: '' } });
    fireEvent.change(within(dialog).getByLabelText('Coluna'), { target: { value: '2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(within(coluna('Fazendo')).getByText('Contratar fotografia')).toBeInTheDocument());
    const put = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/painel/tarefas/11') && init?.method === 'PUT');
    expect(JSON.parse(String(put![1]!.body))).toMatchObject({ prazo: null });
    expect(estado.quadro.colunas[1]!.tarefas.map((t) => t.id)).toEqual([11]);
  });

  it('exclui a tarefa só depois de confirmar', async () => {
    const { rotas } = apiTarefas();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    fireEvent.click(await screen.findByText('Contratar fotografia'));
    const dialog = await screen.findByRole('dialog', { name: 'Editar tarefa' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir tarefa' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(() => expect(screen.queryByText('Contratar fotografia')).not.toBeInTheDocument());
  });

  it('falha ao mover avisa e o cartão volta para a coluna salva', async () => {
    const { rotas } = apiTarefas({ falharMover: true });
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    fireEvent.click(await screen.findByText('Contratar fotografia'));
    const dialog = await screen.findByRole('dialog', { name: 'Editar tarefa' });
    fireEvent.change(within(dialog).getByLabelText('Coluna'), { target: { value: '2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText(/Não foi possível mover a tarefa/)).toBeInTheDocument();
    await waitFor(() => expect(within(coluna('A fazer')).getByText('Contratar fotografia')).toBeInTheDocument());
    expect(within(coluna('Fazendo')).queryByText('Contratar fotografia')).not.toBeInTheDocument();
  });

  it('marca coluna como concluídas e avisa ao tentar ficar sem nenhuma', async () => {
    const { rotas } = apiTarefas();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    await screen.findByText('Contratar fotografia');

    const toggleFeito = screen.getByRole('button', { name: 'Coluna Feito conta como concluída' });
    expect(toggleFeito).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggleFeito);
    expect(await within(coluna('Feito')).findByRole('alert')).toHaveTextContent(
      'O quadro precisa de ao menos uma coluna de concluídas.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Coluna Fazendo conta como concluída' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Coluna Fazendo conta como concluída' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
  });

  it('renomeia uma coluna', async () => {
    const { rotas } = apiTarefas();
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');
    await screen.findByText('Contratar fotografia');

    fireEvent.click(screen.getByRole('button', { name: 'Renomear coluna Fazendo' }));
    fireEvent.change(screen.getByLabelText('Nome da coluna'), { target: { value: ' Em andamento ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('region', { name: 'Em andamento' })).toBeInTheDocument();
  });

  it('mostra carregando e depois erro quando a API falha', async () => {
    const { rotas } = apiTarefas({ falharGet: true });
    mockFetch({ logado: true, rotas });
    renderRoute('/painel/tarefas');

    expect(await screen.findByRole('status')).toHaveTextContent('Carregando…');
    expect(await screen.findByText('Não foi possível carregar as tarefas.')).toBeInTheDocument();
  });
});

describe('moverNoQuadro', () => {
  it('move para o topo de outra coluna e renumera as duas', () => {
    const q = moverNoQuadro(quadroFake(), { id: 11, colunaId: 3, ordem: 0 });
    expect(q.colunas[0]!.tarefas.map((t) => [t.id, t.ordem])).toEqual([[10, 0]]);
    expect(q.colunas[2]!.tarefas.map((t) => [t.id, t.colunaId, t.ordem])).toEqual([
      [11, 3, 0],
      [12, 3, 1],
    ]);
  });

  it('ordem além do fim vai para o fim; mesma coluna reordena sem buracos', () => {
    const q = moverNoQuadro(quadroFake(), { id: 10, colunaId: 1, ordem: 99 });
    expect(q.colunas[0]!.tarefas.map((t) => [t.id, t.ordem])).toEqual([
      [11, 0],
      [10, 1],
    ]);
  });

  it('tarefa ou coluna inexistente não altera o quadro', () => {
    const original = quadroFake();
    expect(moverNoQuadro(original, { id: 999, colunaId: 1, ordem: 0 })).toBe(original);
    expect(moverNoQuadro(original, { id: 10, colunaId: 999, ordem: 0 })).toBe(original);
  });
});
