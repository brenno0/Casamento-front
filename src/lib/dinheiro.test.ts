import { centavosParaInput, formatarCentavos, parseCentavos } from './dinheiro';

describe('dinheiro', () => {
  it('formata centavos em BRL', () => {
    expect(formatarCentavos(123456)).toBe('R$ 1.234,56');
    expect(formatarCentavos(0)).toBe('R$ 0,00');
    expect(formatarCentavos(5)).toBe('R$ 0,05');
  });

  it.each([
    ['1.234,56', 123456],
    ['R$ 1234,5', 123450],
    ['1234', 123400],
    ['0,99', 99],
    ['8.000', 800000],
  ])('parse %s → %d', (texto, esperado) => {
    expect(parseCentavos(texto)).toBe(esperado);
  });

  it.each(['', 'abc', '1,234', '12,345', '1.23,00', '-5'])('parse inválido %s → null', (texto) => {
    expect(parseCentavos(texto)).toBeNull();
  });

  it('volta para texto editável', () => {
    expect(centavosParaInput(123450)).toBe('1234,50');
  });
});
