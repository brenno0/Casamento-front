import { formatDataCurta } from './date';

export interface DadosMensagem {
  grupo: string;
  link: string;
  /** YYYY-MM-DD; exibido como dd/mm/aaaa. */
  prazo: string;
}

/** Troca `{grupo}`, `{link}` e `{prazo}`; marcadores desconhecidos ficam como estão. */
export function montarTexto(modelo: string, dados: DadosMensagem): string {
  const valores: Record<string, string> = {
    grupo: dados.grupo,
    link: dados.link,
    prazo: formatDataCurta(dados.prazo),
  };
  return modelo.replace(/\{(\w+)\}/g, (todo, nome: string) => valores[nome] ?? todo);
}

/** Telefone só com dígitos; 10–11 dígitos (DDD + número) ganham o código do Brasil. */
export function telefoneInternacional(telefone: string): string {
  const d = telefone.replace(/\D/g, '');
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

/** Link `wa.me` com o texto preenchido; sem telefone, o casal escolhe o contato no app. */
export function urlWhatsApp(telefone: string | null | undefined, texto: string): string {
  const destino = telefone ? telefoneInternacional(telefone) : '';
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

export const linkConvite = (token: string, origem = window.location.origin) => `${origem}/c/${token}`;
