import { apiFetch } from './api';

export interface ArquivoEnviado {
  id: number;
  nomeOriginal: string;
  mime: string;
  tamanhoBytes: number;
}

/** Envia um arquivo do painel (PDF/JPEG/PNG/WEBP, até 15 MB). */
export function enviarArquivo(file: File, caminho = '/painel/arquivos'): Promise<ArquivoEnviado> {
  const form = new FormData();
  form.append('arquivo', file);
  return apiFetch<ArquivoEnviado>(caminho, { method: 'POST', body: form });
}

/** URL para abrir/baixar um arquivo do painel. */
export function urlArquivo(id: number): string {
  return `/api/painel/arquivos/${id}`;
}
