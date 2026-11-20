import type { ReactNode } from 'react';
import { IconePainel, type NomeIconePainel } from './IconePainel';

export function Vazio({ icone, className = '', children }: { icone: NomeIconePainel; className?: string; children: ReactNode }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-card border border-dashed border-linha-forte px-6 py-12 text-center text-grafite-suave ${className}`}
    >
      <span className="grid size-10 place-items-center rounded-full bg-nevoa-escuro text-grafite">
        <IconePainel nome={icone} className="size-5" />
      </span>
      <p>{children}</p>
    </div>
  );
}
