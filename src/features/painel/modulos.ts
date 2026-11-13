export interface ModuloPainel {
  slug: string;
  label: string;
}

/**
 * Módulos do painel na navegação. Os que já têm página própria são rotas em `router.tsx`
 * (ex.: `tarefas`); os demais caem no placeholder até a história deles chegar.
 */
export const MODULOS_PAINEL: ModuloPainel[] = [
  { slug: 'tarefas', label: 'Tarefas' },
  { slug: 'fornecedores', label: 'Fornecedores' },
  { slug: 'financeiro', label: 'Financeiro' },
  { slug: 'viagens', label: 'Viagens' },
  { slug: 'convidados', label: 'Convidados' },
  { slug: 'presentes', label: 'Presentes' },
  { slug: 'mural', label: 'Mural' },
  { slug: 'site', label: 'Site' },
  { slug: 'roteiro', label: 'Roteiro do dia' },
];
