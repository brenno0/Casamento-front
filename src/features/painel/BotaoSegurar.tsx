import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

const DURACAO_MS = 900;
const TECLAS = new Set([' ', 'Enter']);

interface BotaoSegurarProps {
  children: ReactNode;
  onConfirmar: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Ação destrutiva sem diálogo de confirmação: segurar o botão (mouse, toque ou Espaço/Enter)
 * enche o fundo; soltar antes do fim cancela.
 */
export function BotaoSegurar({ children, onConfirmar, disabled, className = '', ...aria }: BotaoSegurarProps) {
  const dicaId = useId();
  const [segurando, setSegurando] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  function comecar() {
    if (disabled || temporizador.current !== undefined) return;
    setSegurando(true);
    temporizador.current = window.setTimeout(() => {
      temporizador.current = undefined;
      setSegurando(false);
      onConfirmar();
    }, DURACAO_MS);
  }

  function soltar() {
    window.clearTimeout(temporizador.current);
    temporizador.current = undefined;
    setSegurando(false);
  }

  function aoPressionarTecla(e: KeyboardEvent) {
    if (!TECLAS.has(e.key)) return;
    e.preventDefault();
    if (!e.repeat) comecar();
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={aria['aria-label']}
        aria-describedby={dicaId}
        title="Segure para confirmar"
        data-segurando={segurando || undefined}
        onPointerDown={comecar}
        onPointerUp={soltar}
        onPointerLeave={soltar}
        onPointerCancel={soltar}
        onKeyDown={aoPressionarTecla}
        onKeyUp={(e) => TECLAS.has(e.key) && soltar()}
        onBlur={soltar}
        onContextMenu={(e) => e.preventDefault()}
        className={`segurar ${className}`}
      >
        <span aria-hidden="true" className="segurar-fundo" />
        <span className="relative">{children}</span>
      </button>
      <span id={dicaId} className="sr-only">
        Segure para confirmar
      </span>
    </>
  );
}
