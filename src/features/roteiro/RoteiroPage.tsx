import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { formatDataExtenso } from '../../lib/date';
import { LABEL_FUNCAO, useGrupos, type Funcao } from '../convidados/useConvidados';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { useSitePainel } from '../site-admin/useSiteAdmin';
import { destaques, linkMapa, useEditarRoteiro, useRoteiro, type EnvolvidoInput, type Etapa, type Roteiro } from './roteiro';

export function RoteiroPage() {
  const { data, isPending, isError } = useRoteiro();
  const [agora, setAgora] = useState(() => new Date());
  const [editando, setEditando] = useState<Etapa | 'nova' | null>(null);
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (isPending) return <p role="status">Carregando…</p>;
  if (isError || !data) return <p role="alert" className="text-erro">Não foi possível carregar o roteiro.</p>;
  const d = destaques(data.etapas, data.data, agora);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl">Roteiro do dia</h1>
          <p className="text-verde-suave">{formatDataExtenso(data.data)}</p>
        </div>
        <button type="button" onClick={() => setEditando('nova')} className="rounded-botao bg-verde px-5 py-2 text-linho">
          Nova etapa
        </button>
      </div>
      <ol aria-label="Etapas" className="mt-8 border-l-2 border-folha-escuro pl-6">
        {data.etapas.map((e) => {
          const ehAgora = d.agora === e.id;
          const ehProxima = d.proxima === e.id;
          const mapa = e.local ? linkMapa(e.local) : null;
          return (
            <li
              key={e.id}
              aria-current={ehAgora ? 'step' : undefined}
              className={`relative mb-8 rounded-card p-4 ${ehAgora ? 'bg-vela-claro shadow-suave' : ehProxima ? 'bg-white shadow-suave' : ''}`}
            >
              <span aria-hidden="true" className={`absolute top-6 -left-[33px] h-4 w-4 rounded-full ${ehAgora ? 'bg-verde' : 'bg-folha-escuro'}`} />
              <p className="text-3xl tabular-nums">
                {e.horario}
                {e.horarioFim && <span className="text-xl text-verde-suave"> – {e.horarioFim}</span>}
                {ehAgora && <span className="ml-3 rounded-botao bg-verde px-3 py-0.5 align-middle text-sm text-linho">Agora</span>}
                {ehProxima && <span className="ml-3 rounded-botao bg-musgo px-3 py-0.5 align-middle text-sm text-linho">Próxima</span>}
              </p>
              <h2 className="text-2xl">
                <button type="button" onClick={() => setEditando(e)} className="text-left hover:text-verde">
                  {e.titulo}
                </button>
              </h2>
              {(e.local || e.localTexto) && (
                <p className="text-verde-suave">
                  {e.local?.nome ?? e.localTexto}
                  {mapa && (
                    <a href={mapa} target="_blank" rel="noreferrer" className="ml-2 underline">
                      mapa
                    </a>
                  )}
                </p>
              )}
              {e.descricao && <p className="mt-1 whitespace-pre-line">{e.descricao}</p>}
              {e.envolvidos.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {e.envolvidos.map((en, i) => (
                    <li key={i}>
                      <strong>{en.rotulo}</strong>
                      {en.tipo === 'funcao' && <span className="text-verde-suave">: {en.nomes.length ? en.nomes.join(', ') : 'ninguém cadastrado'}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      {editando && <EtapaModal etapa={editando === 'nova' ? null : editando} onClose={() => setEditando(null)} />}
    </section>
  );
}

function EtapaModal({ etapa, onClose }: { etapa: Etapa | null; onClose: () => void }) {
  const site = useSitePainel();
  const grupos = useGrupos('');
  const convidados = (grupos.data ?? []).flatMap((g) => g.convidados);
  const salvar = useEditarRoteiro((d: object) =>
    etapa ? api.put<Roteiro>(`/painel/roteiro/etapas/${etapa.id}`, d) : api.post<Roteiro>('/painel/roteiro/etapas', d),
  );
  const excluir = useEditarRoteiro(() => api.del<Roteiro>(`/painel/roteiro/etapas/${etapa!.id}`));
  const [d, setD] = useState({
    horario: etapa?.horario ?? '',
    horarioFim: etapa?.horarioFim ?? '',
    titulo: etapa?.titulo ?? '',
    descricao: etapa?.descricao ?? '',
    localId: etapa?.localId ?? null,
  });
  const [envolvidos, setEnvolvidos] = useState<EnvolvidoInput[]>(
    (etapa?.envolvidos ?? []).map((e) =>
      e.tipo === 'convidado' ? { convidadoId: e.convidadoId! } : e.tipo === 'funcao' ? { funcao: e.funcao! } : { texto: e.texto! },
    ),
  );
  const [novoTexto, setNovoTexto] = useState('');
  const fimOk = !d.horarioFim || d.horarioFim > d.horario;
  const rotulo = (e: EnvolvidoInput) =>
    'convidadoId' in e ? (convidados.find((c) => c.id === e.convidadoId)?.nome ?? 'Convidado') : 'funcao' in e ? `${LABEL_FUNCAO[e.funcao]} (todos)` : e.texto;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!d.horario || !d.titulo.trim() || !fimOk) return;
    salvar.mutate(
      { horario: d.horario, horarioFim: d.horarioFim || null, titulo: d.titulo.trim(), descricao: d.descricao.trim(), localId: d.localId, envolvidos },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={etapa ? 'Editar etapa' : 'Nova etapa'} className="max-h-full w-full max-w-lg overflow-y-auto rounded-card bg-linho p-6 shadow-suave">
        <h2 className="text-2xl">{etapa ? 'Editar etapa' : 'Nova etapa'}</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
          <label className="block">
            <span className="text-sm text-verde-suave">Início</span>
            <input type="time" value={d.horario} onChange={(e) => setD({ ...d, horario: e.target.value })} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-verde-suave">Fim (opcional)</span>
            <input type="time" value={d.horarioFim} onChange={(e) => setD({ ...d, horarioFim: e.target.value })} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-verde-suave">Título</span>
            <input maxLength={100} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-verde-suave">Local</span>
            <select value={d.localId ?? ''} onChange={(e) => setD({ ...d, localId: e.target.value ? Number(e.target.value) : null })} className={inputClass}>
              <option value="">Nenhum</option>
              {site.data?.locais.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-verde-suave">Descrição</span>
            <textarea rows={2} maxLength={1000} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} className={inputClass} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm text-verde-suave">Envolvidos</legend>
            <ul className="mt-1 flex flex-wrap gap-2">
              {envolvidos.map((en, i) => (
                <li key={i} className="rounded-botao bg-white px-3 py-1 text-sm">
                  {rotulo(en)}
                  <button type="button" aria-label={`Remover ${rotulo(en)}`} onClick={() => setEnvolvidos(envolvidos.filter((_, j) => j !== i))} className="ml-1">
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <select aria-label="Adicionar função" value="" onChange={(e) => e.target.value && setEnvolvidos([...envolvidos, { funcao: e.target.value as Funcao }])} className={inputClass}>
                <option value="">+ Função</option>
                {Object.entries(LABEL_FUNCAO).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
              <select aria-label="Adicionar convidado" value="" onChange={(e) => e.target.value && setEnvolvidos([...envolvidos, { convidadoId: Number(e.target.value) }])} className={inputClass}>
                <option value="">+ Convidado</option>
                {convidados.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <span className="flex gap-1">
                <input aria-label="Outro envolvido" placeholder="Fotógrafo…" maxLength={80} value={novoTexto} onChange={(e) => setNovoTexto(e.target.value)} className={inputClass} />
                <button
                  type="button"
                  onClick={() => {
                    if (!novoTexto.trim()) return;
                    setEnvolvidos([...envolvidos, { texto: novoTexto.trim() }]);
                    setNovoTexto('');
                  }}
                  className="mt-1 rounded-botao border border-folha-escuro px-3"
                >
                  +
                </button>
              </span>
            </div>
          </fieldset>
          {!fimOk && <p role="alert" className="text-sm text-erro sm:col-span-2">O fim precisa ser depois do início.</p>}
          {salvar.isError && <p role="alert" className="text-erro sm:col-span-2">Não foi possível salvar.</p>}
          <div className="flex justify-between gap-2 sm:col-span-2">
            {etapa ? (
              <button type="button" onClick={() => excluir.mutate(undefined, { onSuccess: onClose })} className="text-erro underline">
                Excluir etapa
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-verde-suave">Cancelar</button>
              <button type="submit" disabled={!d.horario || !d.titulo.trim() || !fimOk || salvar.isPending} className="rounded-botao bg-verde px-6 py-2 text-linho disabled:opacity-60">
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
