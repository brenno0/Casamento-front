import type { ReactNode } from 'react';

/** Ícones de traço fino desenhados para o site, no peso e na cor do texto. */
const TRACOS: Record<string, ReactNode> = {
  anel: (
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="M9.5 5.5 12 3l2.5 2.5L12 8.5z" />
    </>
  ),
  tacas: (
    <>
      <path d="M5 3h5l-.6 5.2a1.9 1.9 0 0 1-3.8 0z M7.5 10v9.5 M5.5 19.5h4" />
      <path d="M14 3h5l-.6 5.2a1.9 1.9 0 0 1-3.8 0z M16.5 10v9.5 M14.5 19.5h4" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  cabide: <path d="M10 5.5a2 2 0 1 1 2 2v2 M12 9.5 3 16.5h18z" />,
  envelope: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="0.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  presente: (
    <>
      <rect x="4" y="10.5" width="16" height="9.5" />
      <rect x="3" y="7" width="18" height="3.5" />
      <path d="M12 7v13 M12 7C10.5 3.5 6.5 3.8 8 7 M12 7c1.5-3.5 5.5-3.2 4 0" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="12.5" rx="0.5" />
      <circle cx="12" cy="13.2" r="3.6" />
      <path d="m8.5 7 1.4-2.5h4.2L15.5 7" />
    </>
  ),
  pena: <path d="M20 4C13 5 8.5 10 7.5 17L6 20 M7.5 17c5-1 9.5-5 11.5-10.5 M4.5 20.5h7" />,
  balao: <path d="M4 5h16v11H10l-4.5 3.5V16H4z" />,
  alfinete: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
};

export type NomeIcone = keyof typeof TRACOS;

export function Icone({ nome, className = 'h-5 w-5' }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {TRACOS[nome]}
    </svg>
  );
}
