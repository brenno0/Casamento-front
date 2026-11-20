import { useId, useState, type FormEvent } from 'react';
import { BotaoFechar } from '../painel/BotaoFechar';
import { useImportarConvidados, type ResultadoImportacao } from './useConvidados';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function resumir(r: ResultadoImportacao): string {
  const partes = [
    r.gruposCriados && plural(r.gruposCriados, 'grupo novo', 'grupos novos'),
    r.convidadosCriados && plural(r.convidadosCriados, 'convidado novo', 'convidados novos'),
    r.convidadosAtualizados && plural(r.convidadosAtualizados, 'convidado completado', 'convidados completados'),
  ].filter(Boolean);
  return partes.length > 0 ? `${partes.join(', ')}.` : 'Nada novo: todos os convidados já estavam cadastrados.';
}

/** Gaveta para importar convidados de um CSV; reimportar a mesma planilha só traz o que falta. */
export function ImportarPlanilha({ onClose }: { onClose: () => void }) {
  const titulo = useId();
  const importar = useImportarConvidados();
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (arquivo) importar.mutate(await arquivo.text());
  }

  return (
    <div className="dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && !importar.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titulo} className="dialogo">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titulo} className="titulo-dialogo">
            Importar planilha
          </h2>
          <BotaoFechar onClick={onClose} disabled={importar.isPending} />
        </div>
        <p className="mt-2 text-sm text-grafite-suave">
          CSV com as colunas do modelo. Quem já está cadastrado não é duplicado: só ganha o que estava em branco.
        </p>
        <a href="/modelo-convidados.csv" download className="acao-link mt-2 inline-block text-sm">
          Baixar modelo
        </a>
        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <label className="block">
            <span className="rotulo">Arquivo CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setArquivo(e.target.files?.[0] ?? null);
                importar.reset();
              }}
              className="mt-1.5 block w-full text-sm"
            />
          </label>
          {importar.isError && (
            <p role="alert" className="text-sm text-erro">
              {importar.error.message}
            </p>
          )}
          {importar.data && (
            <p role="status" className="rounded-xl bg-rose-claro px-4 py-3 text-sm">
              {resumir(importar.data)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={importar.isPending} className="acao-discreta">
              {importar.data ? 'Fechar' : 'Cancelar'}
            </button>
            <button type="submit" disabled={!arquivo || importar.isPending} className="acao">
              {importar.isPending ? 'Importando…' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
