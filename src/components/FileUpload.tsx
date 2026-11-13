import { useId, useState } from 'react';
import { ApiError } from '../lib/api';
import { enviarArquivo, type ArquivoEnviado } from '../lib/upload';

const MENSAGENS: Record<string, string> = {
  ARQUIVO_GRANDE: 'Arquivo grande demais.',
  TIPO_NAO_SUPORTADO: 'Tipo de arquivo não aceito.',
};

/** Input de arquivo que envia na hora e devolve o arquivo salvo. */
export function FileUpload({
  label,
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
  onEnviado,
  caminho,
}: {
  label: string;
  accept?: string;
  onEnviado: (arquivo: ArquivoEnviado) => void;
  caminho?: string;
}) {
  const id = useId();
  const [estado, setEstado] = useState<'ocioso' | 'enviando'>('ocioso');
  const [erro, setErro] = useState<string | null>(null);

  async function onChange(file: File | undefined) {
    if (!file) return;
    setErro(null);
    setEstado('enviando');
    try {
      onEnviado(await enviarArquivo(file, caminho));
    } catch (e) {
      setErro(
        e instanceof ApiError ? (MENSAGENS[e.code] ?? 'Não foi possível enviar o arquivo.') : 'Não foi possível enviar o arquivo.',
      );
    } finally {
      setEstado('ocioso');
    }
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm text-verde-suave">
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={estado === 'enviando'}
        onChange={(e) => {
          void onChange(e.target.files?.[0]);
          e.target.value = '';
        }}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-botao file:border-0 file:bg-vela-claro file:px-4 file:py-1 file:text-verde"
      />
      {estado === 'enviando' && (
        <p role="status" className="mt-1 text-sm text-verde-suave">
          Enviando…
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-1 text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
