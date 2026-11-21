import { useMemo, useState } from 'react';
import { inputClass } from '../fornecedores/FornecedoresPage';
import { BotaoSegurar } from '../painel/BotaoSegurar';
import { Esqueleto } from '../painel/Esqueleto';
import { Dialogo } from './GrupoGaveta';
import { useExcluirEmMassa, useGrupos, type Grupo } from './useConvidados';

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function alternar(conjunto: Set<number>, id: number, marcar: boolean): Set<number> {
  const novo = new Set(conjunto);
  if (marcar) novo.add(id);
  else novo.delete(id);
  return novo;
}

/** Painel lateral para apagar várias pessoas e grupos. Marcar um grupo apaga o grupo e todas as pessoas dele. */
export function ApagarEmMassa({ onClose }: { onClose: () => void }) {
  const { data: grupos, isPending } = useGrupos('');
  const apagar = useExcluirEmMassa();
  const [busca, setBusca] = useState('');
  const [gruposMarcados, setGruposMarcados] = useState<Set<number>>(new Set());
  const [pessoasMarcadas, setPessoasMarcadas] = useState<Set<number>>(new Set());

  const visiveis = useMemo(() => {
    const termo = semAcento(busca);
    if (!termo) return grupos ?? [];
    return (grupos ?? []).filter(
      (g) => semAcento(g.nome).includes(termo) || g.convidados.some((c) => semAcento(c.nome).includes(termo)),
    );
  }, [grupos, busca]);

  const pessoasAvulsas = (grupos ?? [])
    .filter((g) => !gruposMarcados.has(g.id))
    .flatMap((g) => g.convidados.filter((c) => pessoasMarcadas.has(c.id)).map((c) => c.id));
  const totalPessoas =
    pessoasAvulsas.length + (grupos ?? []).filter((g) => gruposMarcados.has(g.id)).reduce((n, g) => n + g.convidados.length, 0);
  const todosMarcados = visiveis.length > 0 && visiveis.every((g) => gruposMarcados.has(g.id));
  const nada = gruposMarcados.size === 0 && pessoasAvulsas.length === 0;

  function marcarTodos(marcar: boolean) {
    setGruposMarcados((atual) => visiveis.reduce((s, g) => alternar(s, g.id, marcar), atual));
  }

  function confirmar() {
    apagar.mutate(
      { grupoIds: [...gruposMarcados], convidadoIds: pessoasAvulsas },
      {
        onSuccess: () => {
          setGruposMarcados(new Set());
          setPessoasMarcadas(new Set());
        },
      },
    );
  }

  return (
    <Dialogo titulo="Apagar convidados" onClose={onClose} ocupado={apagar.isPending} largo>
      <p className="mt-1 text-sm text-grafite-suave">Marcar um grupo apaga o grupo e todas as pessoas dele.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Buscar"
          placeholder="Nome do grupo ou convidado"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={`${inputClass} mt-0 flex-1`}
        />
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={todosMarcados} onChange={(e) => marcarTodos(e.target.checked)} disabled={visiveis.length === 0} />
          Selecionar todos{busca ? ' da busca' : ''}
        </label>
      </div>

      {isPending ? (
        <Esqueleto className="mt-4" />
      ) : (
        <ul aria-label="Grupos" className="mt-4 divide-y divide-linha rounded-card border border-linha">
          {visiveis.map((g) => (
            <LinhaGrupo
              key={g.id}
              g={g}
              grupoMarcado={gruposMarcados.has(g.id)}
              pessoasMarcadas={pessoasMarcadas}
              onGrupo={(m) => setGruposMarcados((s) => alternar(s, g.id, m))}
              onPessoa={(id, m) => setPessoasMarcadas((s) => alternar(s, id, m))}
            />
          ))}
          {visiveis.length === 0 && <li className="px-4 py-3 text-sm text-grafite-suave">Nenhum grupo encontrado.</li>}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-linha bg-white px-6 py-4">
        <p role="status" className="text-sm">
          {apagar.isSuccess && nada
            ? `Apagados: ${plural(apagar.data.convidados, 'pessoa', 'pessoas')} e ${plural(apagar.data.grupos, 'grupo', 'grupos')}.`
            : nada
              ? 'Nada selecionado.'
              : `${plural(totalPessoas, 'pessoa', 'pessoas')} e ${plural(gruposMarcados.size, 'grupo', 'grupos')} selecionados.`}
        </p>
        {apagar.isError && (
          <p role="alert" className="text-sm text-erro">
            Não foi possível apagar.
          </p>
        )}
        <BotaoSegurar disabled={nada || apagar.isPending} onConfirmar={confirmar}>
          Apagar selecionados
        </BotaoSegurar>
      </div>
    </Dialogo>
  );
}

function LinhaGrupo({
  g,
  grupoMarcado,
  pessoasMarcadas,
  onGrupo,
  onPessoa,
}: {
  g: Grupo;
  grupoMarcado: boolean;
  pessoasMarcadas: Set<number>;
  onGrupo: (marcar: boolean) => void;
  onPessoa: (id: number, marcar: boolean) => void;
}) {
  return (
    <li className="px-4 py-3">
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" checked={grupoMarcado} onChange={(e) => onGrupo(e.target.checked)} />
        {g.nome}
        <span className="text-xs font-normal text-grafite-suave">{plural(g.convidados.length, 'pessoa', 'pessoas')}</span>
      </label>
      {g.convidados.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 pl-6">
          {g.convidados.map((c) => (
            <li key={c.id}>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={`${c.nome} (${g.nome})`}
                  checked={grupoMarcado || pessoasMarcadas.has(c.id)}
                  disabled={grupoMarcado}
                  onChange={(e) => onPessoa(c.id, e.target.checked)}
                />
                {c.nome}
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
