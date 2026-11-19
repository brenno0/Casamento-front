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

/** `2027-07-17` → `17/07/2027` (sem passar por fuso horário). */
export function formatDataCurta(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

/** Dias corridos de `de` até `ate` (ambos `YYYY-MM-DD`); negativo se `ate` já passou. */
export function diasEntre(de: string, ate: string): number {
  const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  return Math.round((utc(ate) - utc(de)) / 86_400_000);
}
