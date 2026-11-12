import { screen } from '@testing-library/react';
import { mockFetch, renderRoute } from './test/renderRoute';

describe('rotas', () => {
  beforeEach(() => {
    mockFetch();
  });

  it('/c/:token mostra o site', async () => {
    renderRoute('/c/abc123');
    expect(await screen.findByRole('heading', { name: 'Nayane & Brenno' })).toBeInTheDocument();
  });

  it('/login mostra a página de entrada', () => {
    renderRoute('/login');
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('/painel mostra o layout com a navegação dos módulos', () => {
    renderRoute('/painel');
    const nav = screen.getByRole('navigation', { name: 'Módulos do painel' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toHaveAttribute('href', '/painel/tarefas');
    expect(screen.getByRole('link', { name: 'Financeiro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
  });

  it('/painel/:modulo mostra o placeholder do módulo dentro do layout', () => {
    renderRoute('/painel/fornecedores');
    expect(screen.getByRole('navigation', { name: 'Módulos do painel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fornecedores' })).toBeInTheDocument();
  });

  it('módulo desconhecido do painel mostra 404 dentro do layout', () => {
    renderRoute('/painel/nada');
    expect(screen.getByRole('navigation', { name: 'Módulos do painel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });

  it('caminho aninhado desconhecido do painel cai no catch-all dentro do layout', () => {
    renderRoute('/painel/a/b');
    expect(screen.getByRole('navigation', { name: 'Módulos do painel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });

  it('rota inexistente mostra 404', () => {
    renderRoute('/nao-existe');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
