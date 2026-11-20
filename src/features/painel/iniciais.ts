const TONS = ['bg-rose-claro', 'bg-lavanda-claro', 'bg-pessego-claro', 'bg-nevoa-escuro'];

export function iniciais(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = palavras.at(0)?.charAt(0) ?? '?';
  const ultima = palavras.length > 1 ? (palavras.at(-1)?.charAt(0) ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

/** Mesmo nome, mesmo tom: a cor sai da soma dos códigos das letras. */
export function tomDoAvatar(nome: string): string {
  const soma = [...nome].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return TONS[soma % TONS.length] ?? 'bg-nevoa-escuro';
}
