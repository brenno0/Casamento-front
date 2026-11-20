import { useCallback, useState, type FormEvent } from 'react';
import { QuadroKanban } from './QuadroKanban';
import { TarefaModal, type ModoModal } from './TarefaModal';
import { useCriarColuna, useMoverTarefa, useQuadro, type FiltroTarefas, type MoverVars } from './useTarefas';
import { IconePainel } from '../painel/IconePainel';
import { Esqueleto } from '../painel/Esqueleto';

const FILTROS: { valor: FiltroTarefas; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'atrasadas', label: 'Atrasadas' },
  { valor: 'semana', label: 'Esta semana' },
];

export function TarefasPage() {
  const [filtro, setFiltro] = useState<FiltroTarefas>('todas');
  const [modal, setModal] = useState<ModoModal | null>(null);
  const { data: quadro, isPending, isError, isPlaceholderData } = useQuadro(filtro);
  // Só arrasta na visão completa e com os dados dela (não os do filtro anterior).
  const arrastavel = filtro === 'todas' && !isPlaceholderData;
  const mover = useMoverTarefa();
  const moverTarefa = (vars: MoverVars) => {
    mover.reset();
    mover.mover(vars);
  };
  const fecharModal = useCallback(() => setModal(null), []);

  const primeiraColuna = quadro?.colunas[0];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl">Tarefas</h1>
        <button
          type="button"
          disabled={!primeiraColuna}
          onClick={() => primeiraColuna && setModal({ tipo: 'criar', colunaId: primeiraColuna.id })}
          className="acao"
        >
          <IconePainel nome="mais" />
          Nova tarefa
        </button>
      </div>

      <div role="group" aria-label="Filtro de tarefas" className="segmentos mt-6">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            aria-pressed={filtro === f.valor}
            onClick={() => setFiltro(f.valor)}
            className="segmento"
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtro !== 'todas' && (
        <p className="mt-3 text-sm text-grafite-suave">
          Visão filtrada: para reordenar ou mover cartões, volte para “Todas”.
        </p>
      )}
      {mover.isError && (
        <p className="mt-3 text-erro" role="alert">
          Não foi possível mover a tarefa. O quadro voltou ao estado salvo.
        </p>
      )}

      {isPending && (
        <Esqueleto className="mt-6" />
      )}
      {isError && !quadro && (
        <p className="mt-6 text-erro" role="alert">
          Não foi possível carregar as tarefas.
        </p>
      )}

      {quadro && (
        <div
          aria-busy={isPlaceholderData}
          className={[
            '-mx-gutter mt-6 overflow-x-auto px-gutter pb-4 transition-opacity md:mx-0 md:px-0',
            isPlaceholderData ? 'opacity-60' : '',
          ].join(' ')}
        >
          <div className="flex items-start gap-4">
            <QuadroKanban
              quadro={quadro}
              arrastavel={arrastavel}
              onMover={moverTarefa}
              onEditar={(tarefa) => setModal({ tipo: 'editar', tarefa })}
              onNovaTarefa={(colunaId) => setModal({ tipo: 'criar', colunaId })}
            />
            {arrastavel && <NovaColuna />}
          </div>
        </div>
      )}

      {modal && quadro && (
        <TarefaModal
          key={modal.tipo === 'editar' ? `t-${modal.tarefa.id}` : `c-${modal.colunaId}`}
          modo={modal}
          colunas={quadro.colunas}
          onClose={fecharModal}
          onMover={moverTarefa}
        />
      )}
    </section>
  );
}

function NovaColuna() {
  const [nome, setNome] = useState('');
  const criar = useCriarColuna();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limpo = nome.trim();
    if (limpo === '') return;
    criar.mutate(limpo, { onSuccess: () => setNome('') });
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="w-64 shrink-0 rounded-card border border-dashed border-linha p-3"
    >
      <label className="block">
        <span className="rotulo">Nova coluna</span>
        <input
          maxLength={40}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            criar.reset();
          }}
          className="entrada min-h-9 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={nome.trim() === '' || criar.isPending}
        className="acao-secundaria mt-2 min-h-9 px-4 py-1 text-sm"
      >
        Adicionar coluna
      </button>
      {criar.isError && (
        <p role="alert" className="mt-1 text-sm text-erro">
          Não foi possível criar a coluna.
        </p>
      )}
    </form>
  );
}
