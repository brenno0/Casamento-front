import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { json, mockFetch, renderRoute } from '../../test/renderRoute';
import type { Grupo } from './useConvidados';

const SITE = {
  locais: [],
  config: {
    dressCode: '',
    paleta: [],
    rsvpPrazo: '2027-06-17',
    mensagemConvite: 'Oi, {grupo}! {link} até {prazo} & beijos',
    mensagemLembrete: 'Lembrete {grupo}: {link}',
  },
  historia: [],
  galeria: [],
  faq: [],
};

function grupos(): Grupo[] {
  return [
    {
      id: 1,
      nome: 'Família Souza',
      token: 'tok1',
      mensagem: null,
      statusEnvio: 'nao_enviado',
      enviadoEm: null,
      contatoConvidadoId: 10,
      convidados: [
        { id: 10, grupoId: 1, nome: 'Pai', tipo: 'adulto', lado: 'noivo', funcao: null, telefone: '11988887777', email: null, acompanhantePermitido: false, acompanhanteNome: null, rsvp: 'sem_resposta', rsvpEm: null },
      ],
    },
    {
      id: 2,
      nome: 'Carlos',
      token: 'tok2',
      mensagem: null,
      statusEnvio: 'enviado',
      enviadoEm: '2027-04-01T12:00:00.000Z',
      contatoConvidadoId: null,
      convidados: [
        { id: 20, grupoId: 2, nome: 'Carlos', tipo: 'adulto', lado: 'noiva', funcao: null, telefone: null, email: null, acompanhantePermitido: false, acompanhanteNome: null, rsvp: 'vai', rsvpEm: null },
      ],
    },
  ];
}

function api() {
  const estado = { grupos: grupos() };
  return {
    estado,
    rotas: ({ method, path, search }: { method: string; path: string; search: string }) => {
      if (path === '/painel/site') return json(SITE);
      if (path === '/painel/convidados/resumo') return undefined;
      if (path === '/painel/grupos' && method === 'GET') {
        const nc = new URLSearchParams(search).get('naoConfirmados') === 'true';
        return json(nc ? estado.grupos.filter((g) => g.convidados.some((c) => c.rsvp === 'sem_resposta')) : estado.grupos);
      }
      const m = /^\/painel\/grupos\/(\d+)\/envio$/.exec(path);
      if (m && method === 'POST') {
        const g = estado.grupos.find((x) => x.id === Number(m[1]))!;
        g.statusEnvio = 'enviado';
        g.enviadoEm ??= '2027-04-02T12:00:00.000Z';
        return json(g);
      }
      return undefined;
    },
  };
}

describe('WhatsApp', () => {
  it('Enviar convite abre wa.me com a mensagem e o link e marca o grupo como enviado', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const { rotas } = api();
    const fetchMock = mockFetch({ logado: true, rotas });
    renderRoute('/painel/convidados');
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar convite pelo WhatsApp para Família Souza' }));

    const esperado = `Oi, Família Souza! ${window.location.origin}/c/tok1 até 17/06/2027 & beijos`;
    expect(open).toHaveBeenCalledWith(`https://wa.me/5511988887777?text=${encodeURIComponent(esperado)}`, '_blank', 'noopener');
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/painel/grupos/1/envio', expect.objectContaining({ method: 'POST' })),
    );
    const familia = screen.getByRole('article', { name: 'Grupo Família Souza' });
    expect(await within(familia).findByText(/Enviado em/)).toBeInTheDocument();
  });

  it('grupo sem contato abre wa.me sem telefone e avisa', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    const carlos = await screen.findByRole('article', { name: 'Grupo Carlos' });
    expect(await within(carlos).findByText(/sem contato/)).toBeInTheDocument();
    fireEvent.click(await within(carlos).findByRole('button', { name: /Enviar convite pelo WhatsApp/ }));
    expect(open.mock.calls[0]![0]).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it('filtro de não confirmados mostra Lembrar e lembrete não marca enviado', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const fetchMock = mockFetch({ logado: true, rotas: api().rotas });
    renderRoute('/painel/convidados');
    await screen.findByRole('article', { name: 'Grupo Carlos' });
    expect(screen.queryByRole('button', { name: /^Lembrar/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Só grupos com alguém sem resposta/));
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Grupo Carlos' })).not.toBeInTheDocument());
    fireEvent.click(await screen.findByRole('button', { name: 'Lembrar Família Souza pelo WhatsApp' }));
    expect(decodeURIComponent(String(open.mock.calls[0]![0]))).toContain('Lembrete Família Souza');
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/envio'))).toBe(false);
  });
});
