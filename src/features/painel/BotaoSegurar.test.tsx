import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BotaoSegurar } from './BotaoSegurar';

const esperar = (ms: number) => act(() => new Promise((fim) => setTimeout(fim, ms)));

describe('BotaoSegurar', () => {
  it('confirma depois de segurado', async () => {
    const onConfirmar = vi.fn();
    render(<BotaoSegurar onConfirmar={onConfirmar}>Excluir</BotaoSegurar>);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Excluir' }));
    await esperar(950);
    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it('soltar antes do fim cancela', async () => {
    const onConfirmar = vi.fn();
    render(<BotaoSegurar onConfirmar={onConfirmar}>Excluir</BotaoSegurar>);
    const botao = screen.getByRole('button', { name: 'Excluir' });
    fireEvent.pointerDown(botao);
    await esperar(300);
    fireEvent.pointerUp(botao);
    await esperar(800);
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('segurar Espaço também confirma', async () => {
    const onConfirmar = vi.fn();
    render(<BotaoSegurar onConfirmar={onConfirmar}>Excluir</BotaoSegurar>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Excluir' }), { key: ' ' });
    await esperar(950);
    expect(onConfirmar).toHaveBeenCalledOnce();
  });
});
