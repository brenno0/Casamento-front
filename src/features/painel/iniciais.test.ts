import { describe, expect, it } from 'vitest';
import { iniciais, tomDoAvatar } from './iniciais';

describe('iniciais', () => {
  it('usa a primeira letra do primeiro e do último nome', () => {
    expect(iniciais('Maria da Silva Souza')).toBe('MS');
  });

  it('usa uma letra quando há um nome só', () => {
    expect(iniciais('  ana ')).toBe('A');
  });

  it('devolve ? para nome vazio', () => {
    expect(iniciais('')).toBe('?');
  });
});

describe('tomDoAvatar', () => {
  it('dá sempre o mesmo tom para o mesmo nome', () => {
    expect(tomDoAvatar('Noiva')).toBe(tomDoAvatar('Noiva'));
  });
});
