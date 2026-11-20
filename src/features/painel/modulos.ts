import type { NomeIconePainel } from './IconePainel';

export interface ModuloPainel {
  slug: string;
  label: string;
  icone: NomeIconePainel;
}

export interface GrupoModulos {
  titulo: string;
  modulos: ModuloPainel[];
}

/**
 * Módulos do painel na navegação, agrupados como aparecem na barra lateral. Os que já têm página
 * própria são rotas em `router.tsx` (ex.: `tarefas`); os demais caem no placeholder.
 */
export const GRUPOS_MODULOS: GrupoModulos[] = [
  {
    titulo: 'Planejamento',
    modulos: [
      { slug: 'tarefas', label: 'Tarefas', icone: 'tarefas' },
      { slug: 'fornecedores', label: 'Fornecedores', icone: 'fornecedores' },
      { slug: 'financeiro', label: 'Financeiro', icone: 'financeiro' },
      { slug: 'viagens', label: 'Viagens', icone: 'viagens' },
      { slug: 'roteiro', label: 'Roteiro do dia', icone: 'roteiro' },
    ],
  },
  {
    titulo: 'Convidados',
    modulos: [
      { slug: 'convidados', label: 'Convidados', icone: 'convidados' },
      { slug: 'presentes', label: 'Presentes', icone: 'presentes' },
      { slug: 'mural', label: 'Mural', icone: 'mural' },
      { slug: 'site', label: 'Site', icone: 'site' },
    ],
  },
];

export const MODULOS_PAINEL: ModuloPainel[] = GRUPOS_MODULOS.flatMap((g) => g.modulos);
