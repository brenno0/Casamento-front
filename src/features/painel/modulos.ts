export interface ModuloPainel {
  slug: string;
  label: string;
}

/** Módulos futuros do painel (placeholders até cada história chegar). */
export const MODULOS_PAINEL: ModuloPainel[] = [
  { slug: 'tarefas', label: 'Tarefas' },
  { slug: 'fornecedores', label: 'Fornecedores' },
  { slug: 'financeiro', label: 'Financeiro' },
  { slug: 'viagens', label: 'Viagens' },
  { slug: 'convidados', label: 'Convidados' },
  { slug: 'presentes', label: 'Presentes' },
  { slug: 'site', label: 'Site' },
  { slug: 'roteiro', label: 'Roteiro do dia' },
];
