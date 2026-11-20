import type { ReactNode } from 'react';

/** Ícones de interface do painel: grade de 24, traço de 1.75, cantos redondos. */
const TRACOS = {
  inicio: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  tarefas: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5.1" />
    </>
  ),
  fornecedores: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12.5" rx="3" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5 M3.5 12.5h17" />
    </>
  ),
  financeiro: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="3" />
      <path d="M3.5 10.5h17 M15.5 15h2" />
    </>
  ),
  viagens: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17 M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5 M12 3.5C9.7 5.9 8.6 8.7 8.6 12s1.1 6.1 3.4 8.5" />
    </>
  ),
  convidados: (
    <>
      <circle cx="9.5" cy="8.5" r="3.5" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0 M15.5 5.2a3.5 3.5 0 0 1 0 6.6 M17.5 14.2a6 6 0 0 1 3 5.3" />
    </>
  ),
  presentes: (
    <>
      <rect x="4" y="8" width="16" height="4" rx="1.2" />
      <path d="M5.5 12v6.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V12 M12 8v12 M12 8c-1-2.5-3.7-4-4.8-2.6C6 7 9 8 12 8z M12 8c1-2.5 3.7-4 4.8-2.6C18 7 15 8 12 8z" />
    </>
  ),
  mural: <path d="M5.5 4.5h13A1.5 1.5 0 0 1 20 6v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16A1.5 1.5 0 0 1 4 14.5V6a1.5 1.5 0 0 1 1.5-1.5z" />,
  site: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M3.5 9h17 M7 6.8h.01 M9.5 6.8h.01" />
    </>
  ),
  roteiro: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  configuracoes: (
    <>
      <path d="M4 7.5h9 M17 7.5h3 M4 16.5h3 M11 16.5h9" />
      <circle cx="15" cy="7.5" r="2" />
      <circle cx="9" cy="16.5" r="2" />
    </>
  ),
  sair: <path d="M14.5 4.5H17A2.5 2.5 0 0 1 19.5 7v10a2.5 2.5 0 0 1-2.5 2.5h-2.5 M10 8l-4 4 4 4 M6 12h9" />,
  mais: <path d="M12 5.5v13 M5.5 12h13" />,
  fechar: <path d="M6.5 6.5l11 11 M17.5 6.5l-11 11" />,
  abrir: <path d="M8 16 16 8 M9.5 8H16v6.5" />,
  calendario: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16 M8.5 3.5v4 M15.5 3.5v4" />
    </>
  ),
  coracao: <path d="M12 19.5s-7.5-4.4-7.5-9.8A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 9.8-7.5 9.8z" />,
} satisfies Record<string, ReactNode>;

export type NomeIconePainel = keyof typeof TRACOS;

export function IconePainel({ nome, className = 'size-4' }: { nome: NomeIconePainel; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {TRACOS[nome]}
    </svg>
  );
}
