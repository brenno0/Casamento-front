import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { erro, json, mockFetch, renderRoute, TOKEN_FAKE } from '../../test/renderRoute';
import type { RsvpGrupo } from './RsvpSection';

function rsvpFake(extra: Partial<RsvpGrupo> = {}): RsvpGrupo {
  return {
    grupo: { nome: 'Família Souza', mensagem: null },
    prazo: '2027-06-17',
    bloqueado: false,
    convidados: [
      { id: 1, nome: 'Pai', tipo: 'adulto', rsvp: 'sem_resposta', acompanhantePermitido: false, acompanhanteNome: null },
      { id: 2, nome: 'Tia', tipo: 'adulto', rsvp: 'sem_resposta', acompanhantePermitido: true, acompanhanteNome: null },
    ],
    ...extra,
  };
}

function apiRsvp(inicial = rsvpFake(), opts: { falharPut?: string } = {}) {
  let estado = inicial;
  return ({ method, path, body }: { method: string; path: string; body: unknown }) => {
    if (path !== `/convite/${TOKEN_FAKE}/rsvp`) return undefined;
    if (method === 'GET') return json(estado);
    if (opts.falharPut) return erro(409, opts.falharPut);
    const { respostas } = body as { respostas: { convidadoId: number; rsvp: 'vai' | 'nao_vai'; acompanhanteNome?: string | null }[] };
    estado = {
      ...estado,
      convidados: estado.convidados.map((c) => {
        const r = respostas.find((x) => x.convidadoId === c.id)!;
        return { ...c, rsvp: r.rsvp, acompanhanteNome: r.acompanhanteNome ?? null };
      }),
    };
    return json(estado);
  };
}

beforeEach(() => sessionStorage.clear());

describe('convite', () => {
  it('primeira visita mostra o envelope com o nome do grupo; Pular abre o site e não reaparece', async () => {
    mockFetch({ rotas: apiRsvp() });
    const { unmount } = renderRoute(`/c/${TOKEN_FAKE}`);
    const envelope = await screen.findByRole('dialog', { name: 'Convite para Família Souza' });
    expect(within(envelope).getByRole('heading', { name: 'Família Souza' })).toBeInTheDocument();
    fireEvent.click(within(envelope).getByRole('button', { name: 'Pular' }));
    expect(screen.queryByRole('dialog', { name: /Convite para/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Confirmar presença' })).toBeInTheDocument();
    unmount();

    renderRoute(`/c/${TOKEN_FAKE}`);
    await screen.findByText('Olá, Família Souza!');
    expect(screen.queryByRole('dialog', { name: /Convite para/ })).not.toBeInTheDocument();
  });

  it('abrir o envelope (sem animação em teste) leva ao site', async () => {
    mockFetch({ rotas: apiRsvp() });
    renderRoute(`/c/${TOKEN_FAKE}`);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir convite' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Convite para/ })).not.toBeInTheDocument());
  });

  it('responde RSVP por pessoa com acompanhante e confirma', async () => {
    sessionStorage.setItem(`envelope-aberto:${TOKEN_FAKE}`, '1');
    const fetchMock = mockFetch({ rotas: apiRsvp() });
    renderRoute(`/c/${TOKEN_FAKE}`);
    const form = await screen.findByRole('form', { name: 'Confirmar presença' });
    const confirmar = within(form).getByRole('button', { name: 'Confirmar' });
    expect(confirmar).toBeDisabled();

    const pai = within(form).getByRole('group', { name: 'Pai' });
    fireEvent.click(within(pai).getByLabelText('Não vou'));
    const tia = within(form).getByRole('group', { name: 'Tia' });
    expect(within(tia).queryByLabelText(/acompanhante/)).not.toBeInTheDocument();
    fireEvent.click(within(tia).getByLabelText('Vou'));
    fireEvent.change(within(tia).getByLabelText(/acompanhante/), { target: { value: ' Beto ' } });
    fireEvent.click(confirmar);

    expect(await within(form).findByText(/Sua resposta foi registrada/)).toBeInTheDocument();
    const put = fetchMock.mock.calls.find(([, i]) => i?.method === 'PUT');
    expect(JSON.parse(String(put![1]!.body))).toEqual({
      respostas: [
        { convidadoId: 1, rsvp: 'nao_vai' },
        { convidadoId: 2, rsvp: 'vai', acompanhanteNome: 'Beto' },
      ],
    });
  });

  it('prazo encerrado mostra aviso somente leitura', async () => {
    sessionStorage.setItem(`envelope-aberto:${TOKEN_FAKE}`, '1');
    mockFetch({ rotas: apiRsvp(rsvpFake({ bloqueado: true })) });
    renderRoute(`/c/${TOKEN_FAKE}`);
    expect(await screen.findByText(/O prazo para confirmar presença terminou/)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Confirmar presença' })).not.toBeInTheDocument();
  });

  it('erro RSVP_ENCERRADO ao enviar mostra mensagem', async () => {
    sessionStorage.setItem(`envelope-aberto:${TOKEN_FAKE}`, '1');
    mockFetch({ rotas: apiRsvp(rsvpFake(), { falharPut: 'RSVP_ENCERRADO' }) });
    renderRoute(`/c/${TOKEN_FAKE}`);
    const form = await screen.findByRole('form', { name: 'Confirmar presença' });
    fireEvent.click(within(within(form).getByRole('group', { name: 'Pai' })).getByLabelText('Vou'));
    fireEvent.click(within(within(form).getByRole('group', { name: 'Tia' })).getByLabelText('Vou'));
    fireEvent.click(within(form).getByRole('button', { name: 'Confirmar' }));
    expect(await within(form).findByRole('alert')).toHaveTextContent('O prazo para confirmar presença terminou.');
  });
});

describe('painel: link do convite', () => {
  it('copia o link do grupo', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mockFetch({
      logado: true,
      rotas: ({ path }) => {
        if (path === '/painel/grupos') {
          return json([{ id: 1, nome: 'Família Souza', token: 'tok-abc', mensagem: null, statusEnvio: 'nao_enviado', convidados: [] }]);
        }
        return undefined;
      },
    });
    renderRoute('/painel/convidados');
    fireEvent.click(await screen.findByRole('button', { name: 'Copiar link do convite de Família Souza' }));
    expect(await screen.findByText('copiado!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/c/tok-abc`);
  });
});
