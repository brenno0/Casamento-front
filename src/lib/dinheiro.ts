const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 123456 → "R$ 1.234,56". */
export function formatarCentavos(centavos: number): string {
  // Intl usa espaço não separável; normaliza para espaço comum (texto e testes previsíveis).
  return formatador.format(centavos / 100).replace(/\u00a0/g, ' ');
}

/**
 * "1.234,56", "R$ 1234,5", "1234" → centavos inteiros. Vazio ou inválido → null.
 * Ponto é separador de milhar; vírgula é decimal (até 2 casas).
 */
export function parseCentavos(texto: string): number | null {
  const limpo = texto.replace(/R\$/i, '').replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) return null;
  const [inteiro, decimal = ''] = limpo.replace(/\./g, '').split(',');
  return Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
}

/** Centavos → texto editável "1234,56" (para preencher inputs). */
export function centavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}
