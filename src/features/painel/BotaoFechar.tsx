import { IconePainel } from './IconePainel';

export function BotaoFechar({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label="Fechar" onClick={onClick} disabled={disabled} className="acao-discreta -mt-1 -mr-2 min-h-9 px-2">
      <IconePainel nome="fechar" className="size-5" />
    </button>
  );
}
