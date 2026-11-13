import { act, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { mockFetch, renderRoute, TOKEN_FAKE } from '../../test/renderRoute';
import { instanteCerimonia, linksMapa, tempoRestante } from './useSite';

describe('site público', () => {
  it('mostra nomes, data, história e locais sem endereço, mapa, RSVP nem mural', async () => {
    const fetchMock = mockFetch();
    renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Nayane & Brenno' })).toBeInTheDocument();
    expect(screen.getAllByText('17 de julho de 2027')[0]).toHaveAttribute('datetime', '2027-07-17');
    expect(screen.getByRole('heading', { name: 'Nos conhecemos' })).toBeInTheDocument();
    const cerimonia = screen.getByRole('article', { name: 'Cerimônia' });
    expect(within(cerimonia).getByText('Igreja Matriz')).toBeInTheDocument();
    expect(screen.queryByText(/Rua da Igreja/)).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Mapa/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Google Maps' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Confirmar presença' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mural de recados' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Paleta sugerida')).toBeInTheDocument();
    expect(screen.getByText('Pode levar criança?')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/publico/site', expect.objectContaining({ credentials: 'include' }));
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('falhou', { status: 500 })));
    renderRoute('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
  });
});

describe('site pelo convite', () => {
  it('convite válido mostra saudação, endereços e botões Google Maps/Waze', async () => {
    mockFetch();
    sessionStorage.setItem(`envelope-aberto:${TOKEN_FAKE}`, '1');
    renderRoute(`/c/${TOKEN_FAKE}`);
    expect(await screen.findByText('Olá, Família Souza!')).toBeInTheDocument();
    expect(screen.getByText('Contamos com vocês!')).toBeInTheDocument();
    const cerimonia = screen.getByRole('article', { name: 'Cerimônia' });
    expect(within(cerimonia).getByText('Rua da Igreja, 10 - Porto Seguro')).toBeInTheDocument();
    expect(within(cerimonia).getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=-16.44%2C-39.06',
    );
    expect(within(cerimonia).getByRole('link', { name: 'Waze' })).toHaveAttribute('href', expect.stringContaining('waze.com/ul?ll='));
    expect(screen.getByRole('heading', { name: 'Confirmar presença' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mural de recados' })).toBeInTheDocument();
  });

  it('convite inválido cai na camada pública com aviso', async () => {
    mockFetch();
    renderRoute('/c/token-que-nao-existe-1234567890');
    expect(await screen.findByText(/Não encontramos este convite/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Nayane & Brenno' })).toBeInTheDocument();
    expect(screen.queryByText(/Rua da Igreja/)).not.toBeInTheDocument();
  });
});

describe('contagem regressiva', () => {
  afterEach(() => vi.useRealTimers());

  it('calcula dias, horas, minutos e segundos até 17/07/2027 16:00 em São Paulo', () => {
    const alvo = instanteCerimonia('2027-07-17');
    expect(alvo.toISOString()).toBe('2027-07-17T19:00:00.000Z');
    expect(tempoRestante(alvo, new Date('2027-07-16T18:58:30Z'))).toEqual({
      dias: 1,
      horas: 0,
      minutos: 1,
      segundos: 30,
      chegou: false,
    });
    expect(tempoRestante(alvo, new Date('2027-07-18T00:00:00Z')).chegou).toBe(true);
  });

  it('atualiza a cada segundo na tela', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2027-07-17T18:59:58Z'));
    mockFetch();
    renderRoute('/');
    const timer = await screen.findByRole('timer');
    expect(timer).toHaveTextContent(/0dias0horas0min[12]seg/);
    act(() => {
      vi.setSystemTime(new Date('2027-07-17T19:00:01Z'));
      vi.advanceTimersByTime(1000);
    });
    expect(await screen.findByText('É hoje!')).toBeInTheDocument();
  });

  it('links de mapa pelo endereço quando não há coordenadas', () => {
    const l = { tipo: 'festa' as const, nome: 'X', data: '2027-07-17', horario: '18:30', endereco: 'Rua A, 1', latitude: null, longitude: null };
    expect(linksMapa(l)?.google).toContain('query=Rua%20A%2C%201');
    expect(linksMapa({ ...l, endereco: '' })).toBeNull();
  });
});
