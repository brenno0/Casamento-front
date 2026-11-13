import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { json, mockFetch, renderRoute } from '../../test/renderRoute';
import { agoraEmSaoPaulo, destaques, type Etapa, type Roteiro } from './roteiro';

const LOCAL = { id: 1, tipo: 'cerimonia' as const, nome: 'Igreja Matriz', endereco: 'Rua A', latitude: -16.44, longitude: -39.06 };

function etapa(id: number, horario: string, titulo: string, extra: Partial<Etapa> = {}): Etapa {
  return { id, horario, horarioFim: null, titulo, descricao: '', localId: null, localTexto: '', local: null, envolvidos: [], ...extra };
}

function roteiroFake(): Roteiro {
  return {
    data: '2027-07-17',
    etapas: [
      etapa(1, '15:30', 'Chegada dos padrinhos', {
        envolvidos: [{ tipo: 'funcao', rotulo: 'Padrinhos', nomes: ['Ana', 'Bruno', 'Caio'], convidadoId: null, funcao: 'padrinho', texto: null }],
      }),
      etapa(2, '16:00', 'Cerimônia', { localId: 1, local: LOCAL }),
      etapa(3, '17:30', 'Fotos'),
    ],
  };
}

describe('destaques', () => {
  it('16:10 em São Paulo no dia: Cerimônia agora, Fotos próxima', () => {
    const e = roteiroFake().etapas;
    expect(agoraEmSaoPaulo(new Date('2027-07-17T19:10:00Z'))).toEqual({ dia: '2027-07-17', hora: '16:10' });
    expect(destaques(e, '2027-07-17', new Date('2027-07-17T19:10:00Z'))).toEqual({ agora: 2, proxima: 3 });
    expect(destaques(e, '2027-07-17', new Date('2027-07-17T12:00:00Z'))).toEqual({ agora: null, proxima: 1 });
    expect(destaques(e, '2027-07-17', new Date('2027-07-16T19:10:00Z'))).toEqual({ agora: null, proxima: null });
  });
});

describe('RoteiroPage', () => {
  afterEach(() => vi.useRealTimers());

  it('mostra padrinhos resolvidos, link de mapa e destaque com relógio no dia', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-07-17T19:10:00Z'));
    mockFetch({ logado: true, rotas: ({ path }) => (path === '/painel/roteiro' ? json(roteiroFake()) : undefined) });
    renderRoute('/painel/roteiro');
    const lista = await screen.findByRole('list', { name: 'Etapas' });
    expect(within(lista).getByText(/Ana, Bruno, Caio/)).toBeInTheDocument();
    const atual = lista.querySelector('[aria-current="step"]')!;
    expect(atual).toHaveTextContent('Cerimônia');
    expect(atual).toHaveTextContent('Agora');
    expect(within(atual as HTMLElement).getByRole('link', { name: 'mapa' })).toHaveAttribute('href', expect.stringContaining('-16.44'));
    expect(within(lista).getByText('Próxima').closest('li')).toHaveTextContent('Fotos');
  });

  it('cria etapa com função e texto como envolvidos', async () => {
    let r = roteiroFake();
    const fetchMock = mockFetch({
      logado: true,
      rotas: ({ method, path, body }) => {
        if (path === '/painel/roteiro') return json(r);
        if (path === '/painel/roteiro/etapas' && method === 'POST') {
          const b = body as { horario: string; titulo: string };
          r = { ...r, etapas: [...r.etapas, etapa(9, b.horario, b.titulo)] };
          return json(r, 201);
        }
        if (path === '/painel/grupos') return json([]);
        if (path === '/painel/site') return json({ locais: [{ ...LOCAL }], config: {}, historia: [], galeria: [], faq: [] });
        return undefined;
      },
    });
    renderRoute('/painel/roteiro');
    fireEvent.click(await screen.findByRole('button', { name: 'Nova etapa' }));
    const dialog = screen.getByRole('dialog', { name: 'Nova etapa' });
    fireEvent.change(within(dialog).getByLabelText('Início'), { target: { value: '19:00' } });
    fireEvent.change(within(dialog).getByLabelText('Título'), { target: { value: 'Valsa' } });
    fireEvent.change(within(dialog).getByLabelText('Adicionar função'), { target: { value: 'madrinha' } });
    fireEvent.change(within(dialog).getByLabelText('Outro envolvido'), { target: { value: 'DJ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '+' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith('/painel/roteiro/etapas') && i?.method === 'POST');
    expect(JSON.parse(String(post![1]!.body))).toMatchObject({ horario: '19:00', titulo: 'Valsa', envolvidos: [{ funcao: 'madrinha' }, { texto: 'DJ' }] });
    expect(await screen.findByText('Valsa')).toBeInTheDocument();
  });
});
