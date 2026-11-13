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

  if (isPending) return <p role="status" className="text-center">Carregando…</p>;
  if (isError || !data) {
    return (
      <p role="alert" className="text-center text-rosa-antigo-escuro">
        Não foi possível carregar a lista de presentes.
      </p>
    );
  }
  if (data.length === 0) return <p className="text-center text-grafite-suave">A lista de presentes chega em breve.</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mx-auto mb-8 max-w-2xl text-center text-grafite-suave">
        Sua presença é o nosso maior presente. Se quiser nos mimar, deixamos algumas ideias abaixo.
      </p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <li key={item.id} data-reveal>
            <article aria-label={item.nome} className={`flex h-full flex-col rounded-card border border-dourado-claro bg-white p-4 shadow-suave ${item.esgotado ? 'opacity-70' : ''}`}>
              {item.fotoUrl && <img src={item.fotoUrl} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-card object-cover" />}
              <h3 className="mt-3 text-2xl">{item.nome}</h3>
              {item.viagem && <p className="text-sm text-salvia-escuro">Para a viagem: {item.viagem.nome}</p>}
              {item.descricao && <p className="mt-1 text-grafite-suave">{item.descricao}</p>}
              <p className="mt-2 text-lg">{formatarCentavos(item.precoCentavos)}</p>
              {item.fracionavel && (
                <div className="mt-2">
                  <div className="h-2 overflow-hidden rounded-pill bg-marfim-escuro" role="progressbar" aria-label={`Cotas de ${item.nome}`} aria-valuenow={item.progresso} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-salvia-escuro" style={{ width: `${item.progresso}%` }} />
                  </div>
                  <p className="mt-1 text-sm text-grafite-suave">
                    {item.progresso}% · cotas a partir de {formatarCentavos(item.cotaMinimaCentavos)}
                  </p>
                </div>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {item.esgotado ? (
                  <span className="rounded-pill bg-marfim-escuro px-4 py-2 text-grafite-suave">Já escolhido</span>
                ) : (
                  <>
                    {acaoPresentear?.(item)}
                    {taxas.data?.disponivel && (
                      <button type="button" onClick={() => setPresenteando(item)} className="rounded-pill bg-rosa-antigo-escuro px-4 py-2 text-marfim">
                        {item.fracionavel ? 'Dar uma cota' : 'Presentear'}
                      </button>
                    )}
                    {!item.fracionavel && item.linkLoja && (
                      <a href={item.linkLoja} target="_blank" rel="noreferrer noopener" className="rounded-pill border border-rosa-antigo-escuro px-4 py-2 text-rosa-antigo-escuro">
                        Comprar na loja
                      </a>
                    )}
                    {!item.fracionavel && (
                      <button type="button" onClick={() => setComprando(item)} className="rounded-pill px-4 py-2 text-grafite-suave underline">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-grafite/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && !enviar.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="max-h-full w-full max-w-md overflow-y-auto rounded-card bg-marfim p-6 shadow-suave">
        <h2 id={tituloId} className="text-2xl">
          {obrigado ? 'Muito obrigado!' : `Já comprei: ${item.nome}`}
        </h2>
        {obrigado ? (
          <>
            <p className="mt-3">Recebemos seu aviso. Que carinho! 💛</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim">
              Fechar
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>
            <label className="block">
              <span className="text-sm text-grafite-suave">Seu nome</span>
              <input autoFocus maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-grafite-suave">Mensagem para o casal (opcional)</span>
              <textarea rows={3} maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-grafite-suave">Nº do pedido (opcional)</span>
              <input maxLength={80} value={pedido} onChange={(e) => setPedido(e.target.value)} className="mt-1 block w-full rounded-card border border-dourado-claro bg-white px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-grafite-suave">Foto do pedido (opcional)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void onFoto(e.target.files?.[0])} className="mt-1 block w-full text-sm" />
            </label>
            {foto && <p className="text-sm text-salvia-escuro">Foto anexada.</p>}
            {erroFoto && <p role="alert" className="text-sm text-rosa-antigo-escuro">{erroFoto}</p>}
            {enviar.isError && (
              <p role="alert" className="text-rosa-antigo-escuro">
                {enviar.error instanceof ApiError && enviar.error.status === 429 ? 'Muitas tentativas. Tente em um minuto.' : 'Não foi possível registrar agora.'}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-grafite-suave">
                Cancelar
              </button>
              <button type="submit" disabled={!nome.trim() || enviar.isPending} className="rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim disabled:opacity-60">
                Avisar o casal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
