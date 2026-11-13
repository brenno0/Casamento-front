import {
  closestCorners,
  defaultDropAnimation,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, type FormEvent, type KeyboardEventHandler, type PointerEventHandler, type ReactNode } from 'react';
import { ApiError } from '../../lib/api';
import { formatDataCurta } from '../../lib/date';
import {
  estaAtrasada,
  RESPONSAVEIS,
  useExcluirColuna,
  useRenomearColuna,
  type Coluna,
  type ColunaComTarefas,
  type Quadro,
  type Tarefa,
} from './useTarefas';

type Itens = Record<number, number[]>;

const idTarefa = (id: number) => `t-${id}`;
const idColuna = (id: number) => `c-${id}`;

function parseId(id: UniqueIdentifier): { tipo: 'tarefa' | 'coluna'; id: number } {
  const [prefixo, num] = String(id).split('-');
  return { tipo: prefixo === 'c' ? 'coluna' : 'tarefa', id: Number(num) };
}

function itensDoQuadro(quadro: Quadro): Itens {
  return Object.fromEntries(quadro.colunas.map((c) => [c.id, c.tarefas.map((t) => t.id)]));
}

function colunaDe(itens: Itens, id: UniqueIdentifier): number | undefined {
  const alvo = parseId(id);
  if (alvo.tipo === 'coluna') return alvo.id in itens ? alvo.id : undefined;
  const entrada = Object.entries(itens).find(([, ids]) => ids.includes(alvo.id));
  return entrada ? Number(entrada[0]) : undefined;
}

function prefereMenosMovimento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const LABEL_RESPONSAVEL = Object.fromEntries(RESPONSAVEIS.map((r) => [r.valor, r.label]));

export interface QuadroKanbanProps {
  quadro: Quadro;
  /** Arrastar e soltar só na visão completa (nas filtradas a ordem não é a da coluna). */
  arrastavel: boolean;
  onMover: (vars: { id: number; colunaId: number; ordem: number }) => void;
  onEditar: (tarefa: Tarefa) => void;
  onNovaTarefa: (colunaId: number) => void;
}

export function QuadroKanban({ quadro, arrastavel, onMover, onEditar, onNovaTarefa }: QuadroKanbanProps) {
  const [arrasto, setArrasto] = useState<{ itens: Itens; ativo: number } | null>(null);
  const sensors = useSensors(
    // Distância mínima: um clique simples continua abrindo a tarefa.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dropAnimation = useMemo(() => (prefereMenosMovimento() ? null : defaultDropAnimation), []);

  const tarefas = useMemo(
    () => new Map(quadro.colunas.flatMap((c) => c.tarefas).map((t) => [t.id, t])),
    [quadro],
  );
  const itens = arrasto?.itens ?? itensDoQuadro(quadro);
  const ativa = arrasto ? tarefas.get(arrasto.ativo) : undefined;
  const colunaAtiva = ativa
    ? quadro.colunas.find((c) => c.id === colunaDe(itens, idTarefa(ativa.id)))
    : undefined;

  function onDragStart({ active }: DragStartEvent) {
    setArrasto({ itens: itensDoQuadro(quadro), ativo: parseId(active.id).id });
  }

  // Ao passar sobre outra coluna, o cartão já muda de coluna (animação entre colunas).
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || !arrasto) return;
    const de = colunaDe(arrasto.itens, active.id);
    const para = colunaDe(arrasto.itens, over.id);
    if (de === undefined || para === undefined || de === para) return;

    const ativoId = parseId(active.id).id;
    const destino = arrasto.itens[para] ?? [];
    const alvo = parseId(over.id);
    const indice = alvo.tipo === 'coluna' ? destino.length : Math.max(0, destino.indexOf(alvo.id));
    setArrasto({
      ...arrasto,
      itens: {
        ...arrasto.itens,
        [de]: (arrasto.itens[de] ?? []).filter((id) => id !== ativoId),
        [para]: [...destino.slice(0, indice), ativoId, ...destino.slice(indice)],
      },
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const estado = arrasto;
    setArrasto(null);
    if (!over || !estado) return;

    const ativoId = parseId(active.id).id;
    const colunaId = colunaDe(estado.itens, over.id);
    if (colunaId === undefined) return;
    const lista = estado.itens[colunaId] ?? [];
    const de = lista.indexOf(ativoId);
    if (de < 0) return;
    const alvo = parseId(over.id);
    const para = alvo.tipo === 'coluna' ? lista.length - 1 : lista.indexOf(alvo.id);
    const final = arrayMove(lista, de, para < 0 ? de : para);
    const ordem = final.indexOf(ativoId);

    const original = tarefas.get(ativoId);
    const ordemOriginal = quadro.colunas
      .find((c) => c.id === original?.colunaId)
      ?.tarefas.findIndex((t) => t.id === ativoId);
    if (original?.colunaId === colunaId && ordemOriginal === ordem) return;
    onMover({ id: ativoId, colunaId, ordem });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setArrasto(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Para mover a tarefa, pressione espaço ou Enter, use as setas e pressione espaço ou Enter de novo para soltar. Esc cancela.',
        },
      }}
    >
      <div className="flex items-start gap-4">
        {quadro.colunas.map((coluna) => (
          <ColunaKanban
            key={coluna.id}
            coluna={coluna}
            tarefas={(itens[coluna.id] ?? []).flatMap((id) => tarefas.get(id) ?? [])}
            hoje={quadro.hoje}
            arrastavel={arrastavel}
            onEditar={onEditar}
            onNovaTarefa={onNovaTarefa}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {ativa ? (
          <CartaoConteudo
            tarefa={ativa}
            atrasada={colunaAtiva ? estaAtrasada(ativa, colunaAtiva, quadro.hoje) : false}
            className="rotate-2 shadow-suave"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function ColunaKanban({
  coluna,
  tarefas,
  hoje,
  arrastavel,
  onEditar,
  onNovaTarefa,
}: {
  coluna: ColunaComTarefas;
  tarefas: Tarefa[];
  hoje: string;
  arrastavel: boolean;
  onEditar: (tarefa: Tarefa) => void;
  onNovaTarefa: (colunaId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: idColuna(coluna.id), disabled: !arrastavel });

  return (
    <section
      aria-label={coluna.nome}
      className="flex w-72 shrink-0 flex-col rounded-card border border-folha bg-white/70"
    >
      <CabecalhoColuna coluna={coluna} total={tarefas.length} />
      <SortableContext items={tarefas.map((t) => idTarefa(t.id))} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={[
            'flex min-h-24 flex-col gap-2 px-3 pb-3 transition-colors',
            isOver ? 'bg-vela-claro/30' : '',
          ].join(' ')}
        >
          {tarefas.map((t) => (
            <CartaoTarefa
              key={t.id}
              tarefa={t}
              atrasada={estaAtrasada(t, coluna, hoje)}
              arrastavel={arrastavel}
              onEditar={onEditar}
            />
          ))}
          {tarefas.length === 0 && <li className="py-4 text-center text-sm text-verde-suave">Nada aqui.</li>}
        </ul>
      </SortableContext>
      <button
        type="button"
        onClick={() => onNovaTarefa(coluna.id)}
        aria-label={`Nova tarefa em ${coluna.nome}`}
        className="mx-3 mb-3 rounded-botao px-3 py-1.5 text-left text-musgo hover:bg-folha-claro/50"
      >
        + Nova tarefa
      </button>
    </section>
  );
}

function CabecalhoColuna({ coluna, total }: { coluna: Coluna; total: number }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(coluna.nome);
  const renomear = useRenomearColuna();
  const excluir = useExcluirColuna();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limpo = nome.trim();
    if (limpo === '') return;
    renomear.mutate({ id: coluna.id, nome: limpo }, { onSuccess: () => setEditando(false) });
  }

  return (
    <header className="px-3 pt-3 pb-2">
      {editando ? (
        <form onSubmit={onSubmit} className="flex gap-2" noValidate>
          <label className="sr-only" htmlFor={`coluna-${coluna.id}`}>
            Nome da coluna
          </label>
          <input
            id={`coluna-${coluna.id}`}
            autoFocus
            maxLength={40}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              renomear.reset();
            }}
            className="min-w-0 flex-1 rounded-card border border-folha bg-white px-2 py-1"
          />
          <button
            type="submit"
            disabled={nome.trim() === '' || renomear.isPending}
            className="rounded-botao bg-verde px-3 py-1 text-sm text-linho disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditando(false);
              setNome(coluna.nome);
              renomear.reset();
            }}
            className="rounded-botao px-2 py-1 text-sm text-verde-suave"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <h2 className="flex-1 truncate text-xl">
            {coluna.nome} <span className="text-base text-verde-suave">({total})</span>
          </h2>
          <button
            type="button"
            aria-label={`Renomear coluna ${coluna.nome}`}
            onClick={() => {
              setNome(coluna.nome);
              setEditando(true);
              excluir.reset();
            }}
            className="rounded-botao px-2 py-0.5 text-sm text-verde-suave hover:bg-linho-escuro"
          >
            Renomear
          </button>
          <button
            type="button"
            aria-label={`Coluna ${coluna.nome} conta como concluída`}
            aria-pressed={coluna.concluida}
            title="Tarefas nesta coluna contam como concluídas"
            disabled={renomear.isPending}
            onClick={() => {
              excluir.reset();
              renomear.mutate({ id: coluna.id, concluida: !coluna.concluida });
            }}
            className={`rounded-botao px-2 py-0.5 text-sm hover:bg-linho-escuro disabled:opacity-60 ${
              coluna.concluida ? 'bg-folha-claro text-tinta' : 'text-verde-suave'
            }`}
          >
            {coluna.concluida ? '✓ Concluídas' : 'Concluídas?'}
          </button>
          {confirmandoExclusao ? (
            <>
              <button
                type="button"
                disabled={excluir.isPending}
                onClick={() =>
                  excluir.mutate(coluna.id, { onSettled: () => setConfirmandoExclusao(false) })
                }
                className="rounded-botao bg-verde px-2 py-0.5 text-sm text-linho disabled:opacity-60"
              >
                Confirmar exclusão
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="rounded-botao px-2 py-0.5 text-sm text-verde-suave"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label={`Excluir coluna ${coluna.nome}`}
              onClick={() => {
                renomear.reset();
                excluir.reset();
                setConfirmandoExclusao(true);
              }}
              className="rounded-botao px-2 py-0.5 text-sm text-verde hover:bg-vela-claro"
            >
              Excluir
            </button>
          )}
        </div>
      )}
      {renomear.isError && (
        <p role="alert" className="mt-1 text-sm text-erro">
          {renomear.error instanceof ApiError && renomear.error.code === 'ULTIMA_COLUNA_CONCLUIDA'
            ? 'O quadro precisa de ao menos uma coluna de concluídas.'
            : renomear.error instanceof ApiError && renomear.error.status === 400
              ? 'Nome da coluna: de 1 a 40 caracteres.'
              : 'Não foi possível salvar a coluna.'}
        </p>
      )}
      {excluir.isError && (
        <p role="alert" className="mt-1 text-sm text-erro">
          {excluir.error instanceof ApiError && excluir.error.code === 'COLUNA_NAO_VAZIA'
            ? 'Esvazie a coluna antes de excluí-la.'
            : excluir.error instanceof ApiError && excluir.error.code === 'ULTIMA_COLUNA_CONCLUIDA'
              ? 'O quadro precisa de ao menos uma coluna de concluídas.'
              : 'Não foi possível excluir a coluna.'}
        </p>
      )}
    </header>
  );
}

function CartaoTarefa({
  tarefa,
  atrasada,
  arrastavel,
  onEditar,
}: {
  tarefa: Tarefa;
  atrasada: boolean;
  arrastavel: boolean;
  onEditar: (tarefa: Tarefa) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: idTarefa(tarefa.id), disabled: !arrastavel });
  // Ponteiro: arrasta pelo cartão todo. Teclado: só pela alça (Enter no cartão abre a edição).
  const onPointerDown = listeners?.onPointerDown as PointerEventHandler | undefined;
  const onKeyDown = listeners?.onKeyDown as KeyboardEventHandler | undefined;

  return (
    <li
      ref={setNodeRef}
      onPointerDown={onPointerDown}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[isDragging ? 'opacity-40' : '', arrastavel ? 'touch-none' : ''].join(' ')}
    >
      <CartaoConteudo
        tarefa={tarefa}
        atrasada={atrasada}
        onEditar={() => onEditar(tarefa)}
        alca={
          arrastavel ? (
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              onKeyDown={onKeyDown}
              aria-label={`Mover ${tarefa.titulo}`}
              className="cursor-grab rounded px-1 text-verde-suave hover:text-tinta active:cursor-grabbing"
            >
              ⠿
            </button>
          ) : null
        }
      />
    </li>
  );
}

function CartaoConteudo({
  tarefa,
  atrasada,
  onEditar,
  alca,
  className = '',
}: {
  tarefa: Tarefa;
  atrasada: boolean;
  onEditar?: () => void;
  alca?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`flex gap-2 rounded-card border border-linho-escuro bg-white p-3 transition-shadow hover:shadow-suave ${className}`}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onEditar}
          className="block w-full text-left leading-snug text-tinta hover:text-verde"
        >
          {tarefa.titulo}
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {tarefa.prazo && (
            <span className={atrasada ? 'text-erro' : 'text-verde-suave'}>
              {formatDataCurta(tarefa.prazo)}
            </span>
          )}
          <span className="rounded-botao bg-folha-claro px-2 text-musgo">
            {LABEL_RESPONSAVEL[tarefa.responsavel]}
          </span>
          {tarefa.fornecedorNome && (
            <span className="rounded-botao bg-folha px-2 text-tinta">{tarefa.fornecedorNome}</span>
          )}
          {atrasada && (
            <span className="rounded-botao bg-verde px-2 text-linho">Atrasada</span>
          )}
        </div>
      </div>
      {alca}
    </article>
  );
}
