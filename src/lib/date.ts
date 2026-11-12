const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** `2027-07-17` → `17 de julho de 2027` (sem passar por fuso horário). */
export function formatDataExtenso(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, ano, mes, dia] = match;
  const nomeMes = MESES[Number(mes) - 1];
  if (!nomeMes) return isoDate;
  return `${Number(dia)} de ${nomeMes} de ${ano}`;
}
