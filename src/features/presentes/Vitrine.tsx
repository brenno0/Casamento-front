import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../../lib/api';
import { formatarCentavos } from '../../lib/dinheiro';
import { useTaxas } from './checkout';
import { PresentearModal } from './PresentearModal';
import { enviarFotoConvidado, useJaComprei, useVitrine, type Camada, type ItemVitrine } from './usePresentes';

/**
 * Lista de presentes discreta (ux-direction.md): sem cobrança; presente opcional e
 * desvinculado do RSVP. `acaoPresentear` é o botão de checkout (história 12).
 */
export function Vitrine({
  token,
  nomePadrao,
  acaoPresentear,
}: {
  token: Camada;
  nomePadrao?: string;
  acaoPresentear?: (item: ItemVitrine) => ReactNode;
}) {
  const { data, isPending, isError } = useVitrine(token);
  const taxas = useTaxas();
  const [comprando, setComprando] = useState<ItemVitrine | null>(null);
  const [presenteando, setPresenteando] = useState<ItemVitrine | null>(null);

  if (isPending) return <p role="status" className="text-verde-suave">Carregando…</p>;
  if (isError || !data) {
    return (
      <p role="alert" className="text-erro">
        Não foi possível carregar a lista de presentes.
      </p>
    );
  }
  if (data.length === 0) return <p className="text-verde-suave">A lista de presentes chega em breve.</p>;

  return (
    <div>
      <p className="mb-16 max-w-[32ch] font-caslon text-2xl leading-relaxed text-verde">
        Sua presença é o nosso maior presente. Se quiser nos mimar, deixamos algumas ideias abaixo.
      </p>
      <ul className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <li key={item.id} data-reveal>
            <article aria-label={item.nome} className={`flex h-full flex-col ${item.esgotado ? 'opacity-60' : ''}`}>
              {item.fotoUrl && <img src={item.fotoUrl} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}
              <h3 className="mt-5 text-2xl">{item.nome}</h3>
              {item.viagem && <p className="mt-1 text-sm text-musgo">Para a viagem: {item.viagem.nome}</p>}
              {item.descricao && <p className="mt-1 text-verde-suave">{item.descricao}</p>}
              <p className="mt-3 font-display text-2xl text-verde">{formatarCentavos(item.precoCentavos)}</p>
              {item.fracionavel && (
                <div className="mt-4">
                  <div className="h-1 overflow-hidden bg-folha" role="progressbar" aria-label={`Cotas de ${item.nome}`} aria-valuenow={item.progresso} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-verde" style={{ width: `${item.progresso}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-verde-suave">
                    {item.progresso}% · cotas a partir de {formatarCentavos(item.cotaMinimaCentavos)}
                  </p>
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                {item.esgotado ? (
                  <span className="font-caslon text-lg text-verde-suave italic">Já escolhido</span>
                ) : (
                  <>
                    {acaoPresentear?.(item)}
                    {taxas.data?.disponivel && (
                      <button type="button" onClick={() => setPresenteando(item)} className="botao px-6">
                        {item.fracionavel ? 'Dar uma cota' : 'Presentear'}
                      </button>
                    )}
                    {!item.fracionavel && item.linkLoja && (
                      <a href={item.linkLoja} target="_blank" rel="noreferrer noopener" className="botao-contorno px-6">
                        Comprar na loja
                      </a>
                    )}
                    {!item.fracionavel && (
                      <button type="button" onClick={() => setComprando(item)} className="py-2 text-verde-suave underline hover:text-verde">
                        Já comprei
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
      {presenteando && taxas.data && (
        <PresentearModal item={presenteando} token={token} nomePadrao={nomePadrao} taxas={taxas.data} onClose={() => setPresenteando(null)} />
      )}
      {comprando && <JaCompreiModal item={comprando} token={token} nomePadrao={nomePadrao} onClose={() => setComprando(null)} />}
    </div>
  );
}

function JaCompreiModal({ item, token, nomePadrao, onClose }: { item: ItemVitrine; token: Camada; nomePadrao?: string; onClose: () => void }) {
  const tituloId = useId();
  const enviar = useJaComprei(token);
  const [nome, setNome] = useState(nomePadrao ?? '');
  const [mensagem, setMensagem] = useState('');
  const [pedido, setPedido] = useState('');
  const [foto, setFoto] = useState<number | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [obrigado, setObrigado] = useState(false);

  async function onFoto(file: File | undefined) {
    if (!file) return;
    setErroFoto(null);
    try {
      setFoto((await enviarFotoConvidado(file)).id);
    } catch (e) {
      setErroFoto(e instanceof ApiError && e.code === 'ARQUIVO_GRANDE' ? 'Foto maior que 5 MB.' : 'Não foi possível enviar a foto (use JPG, PNG ou WEBP).');
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nome.trim()) return;
    enviar.mutate(
      { itemId: item.id, doadorNome: nome.trim(), mensagem: mensagem.trim(), numeroPedido: pedido.trim() || null, fotoArquivoId: foto },
      { onSuccess: () => setObrigado(true) },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && !enviar.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="max-h-full w-full max-w-lg overflow-y-auto rounded-card bg-linho p-7 shadow-suave sm:p-10">
        <h2 id={tituloId} className="text-3xl">
          {obrigado ? 'Muito obrigado!' : `Já comprei: ${item.nome}`}
        </h2>
        {obrigado ? (
          <>
            <p className="mt-3">Recebemos seu aviso. Que carinho! 💛</p>
            <button type="button" onClick={onClose} className="botao mt-8">
              Fechar
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <label className="block">
              <span className="text-sm font-medium text-verde-suave">Seu nome</span>
              <input autoFocus maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className="campo" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-verde-suave">Mensagem para o casal (opcional)</span>
              <textarea rows={3} maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="campo" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-verde-suave">Nº do pedido (opcional)</span>
              <input maxLength={80} value={pedido} onChange={(e) => setPedido(e.target.value)} className="campo" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-verde-suave">Foto do pedido (opcional)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void onFoto(e.target.files?.[0])} className="mt-2 block w-full text-sm" />
            </label>
            {foto && <p className="text-sm text-musgo">Foto anexada.</p>}
            {erroFoto && <p role="alert" className="text-sm text-erro">{erroFoto}</p>}
            {enviar.isError && (
              <p role="alert" className="text-erro">
                {enviar.error instanceof ApiError && enviar.error.status === 429 ? 'Muitas tentativas. Tente em um minuto.' : 'Não foi possível registrar agora.'}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-3 text-verde-suave hover:text-verde">
                Cancelar
              </button>
              <button type="submit" disabled={!nome.trim() || enviar.isPending} className="botao">
                Avisar o casal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
