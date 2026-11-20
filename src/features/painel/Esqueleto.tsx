/** Carregamento do painel: blocos com brilho no lugar do conteúdo, texto só para leitor de tela. */
export function Esqueleto({ linhas = 3, className = '' }: { linhas?: number; className?: string }) {
  return (
    <div role="status" className={`space-y-2.5 ${className}`}>
      <span className="sr-only">Carregando…</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} aria-hidden="true" className="esqueleto h-14" style={{ opacity: 1 - i * 0.18 }} />
      ))}
    </div>
  );
}
