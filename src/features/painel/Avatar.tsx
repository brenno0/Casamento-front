import { iniciais, tomDoAvatar } from './iniciais';

export function Avatar({ nome, className = '' }: { nome: string; className?: string }) {
  return (
    <span aria-hidden="true" title={nome} className={`avatar ${tomDoAvatar(nome)} ${className}`}>
      {iniciais(nome)}
    </span>
  );
}
