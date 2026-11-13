import { useEffect, useId, useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import {
  RESPONSAVEIS,
  useAtualizarTarefa,
  useCriarTarefa,
  useExcluirTarefa,
  type Coluna,
  type MoverVars,
  type Responsavel,
  type Tarefa,
} from './useTarefas';
import { useFornecedores } from '../fornecedores/useFornecedores';

export type ModoModal = { tipo: 'criar'; colunaId: number } | { tipo: 'editar'; tarefa: Tarefa };

const TITULO_MAX = 140;

const inputClass =
  'mt-1 block w-full rounded-card border border-folha bg-white px-3 py-2 text-tinta focus:border-folha-escuro';

export function TarefaModal({
  modo,
  colunas,
  onClose,
  onMover,
}: {
  modo: ModoModal;
  colunas: Coluna[];
  onClose: () => void;
  /** Move a tarefa (o quadro mostra o erro, se houver). */
  onMover: (vars: MoverVars) => void;
}) {
  const tituloId = useId();
  const tarefa = modo.tipo === 'editar' ? modo.tarefa : null;

  const [titulo, setTitulo] = useState(tarefa?.titulo ?? '');
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? '');
  const [prazo, setPrazo] = useState(tarefa?.prazo ?? '');
  const [responsavel, setResponsavel] = useState<Responsavel>(tarefa?.responsavel ?? 'ambos');
  const [colunaId, setColunaId] = useState(modo.tipo === 'criar' ? modo.colunaId : (tarefa?.colunaId ?? 0));
  const [fornecedorId, setFornecedorId] = useState<number | null>(tarefa?.fornecedorId ?? null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const fornecedores = useFornecedores();

  const criar = useCriarTarefa();
  const atualizar = useAtualizarTarefa();
  const excluir = useExcluirTarefa();
  const salvar = tarefa ? atualizar : criar;
  const ocupado = criar.isPending || atualizar.isPending || excluir.isPending;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // Fechar com salvamento em andamento esconderia um erro que ainda pode chegar.
      if (event.key === 'Escape' && !ocupado) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, ocupado]);

  const invalido = titulo.trim() === '';

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalido) return;
    const dados = {
      titulo: titulo.trim(),
      descricao: descricao.trim() === '' ? null : descricao.trim(),
      prazo: prazo === '' ? null : prazo,
      responsavel,
      fornecedorId,
    };
    if (tarefa) {
      const mudouColuna = colunaId !== tarefa.colunaId;
      atualizar.mutate(
        { id: tarefa.id, ...dados },
        {
          onSuccess: () => {
            // Ordem acima do tamanho da coluna: o servidor coloca no fim.
            if (mudouColuna) onMover({ id: tarefa.id, colunaId, ordem: Number.MAX_SAFE_INTEGER });
            onClose();
          },
        },
      );
    } else {
      criar.mutate({ ...dados, colunaId }, { onSuccess: onClose });
    }
  }

  function limparErros() {
    criar.reset();
    atualizar.reset();
  }

  const erro = salvar.error ?? excluir.error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !ocupado) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-card bg-linho p-6 shadow-suave"
      >
        <h2 id={tituloId} className="text-2xl">
          {tarefa ? 'Editar tarefa' : 'Nova tarefa'}
        </h2>
        <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
          <label className="block">
            <span className="text-sm text-verde-suave">Título</span>
            <input
              autoFocus
              required
              maxLength={TITULO_MAX}
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                limparErros();
              }}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-sm text-verde-suave">Descrição</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                limparErros();
              }}
              className={inputClass}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-verde-suave">Prazo</span>
              <input
                type="date"
                value={prazo}
                onChange={(e) => {
                  setPrazo(e.target.value);
                  limparErros();
                }}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm text-verde-suave">Responsável</span>
              <select
                value={responsavel}
                onChange={(e) => {
                  setResponsavel(e.target.value as Responsavel);
                  limparErros();
                }}
                className={inputClass}
              >
                {RESPONSAVEIS.map((r) => (
                  <option key={r.valor} value={r.valor}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm text-verde-suave">Fornecedor</span>
            <select
              value={fornecedorId ?? ''}
              onChange={(e) => {
                setFornecedorId(e.target.value === '' ? null : Number(e.target.value));
                limparErros();
              }}
              className={inputClass}
            >
              <option value="">Nenhum</option>
              {(fornecedores.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.categoria})
                </option>
              ))}
            </select>
          </label>
          {(
            <label className="block">
              <span className="text-sm text-verde-suave">Coluna</span>
              <select
                value={colunaId}
                onChange={(e) => setColunaId(Number(e.target.value))}
                className={inputClass}
              >
                {colunas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          {invalido && titulo !== '' && (
            <p className="text-erro" role="alert">
              O título é obrigatório.
            </p>
          )}
          {erro && (
            <p className="text-erro" role="alert">
              {erro instanceof ApiError && erro.status === 400
                ? 'Confira os campos (título até 140 caracteres).'
                : erro instanceof ApiError && erro.status === 404
                  ? 'Essa tarefa ou coluna não existe mais.'
                  : 'Não foi possível salvar agora. Tente novamente.'}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={invalido || ocupado}
              className="rounded-botao bg-verde px-6 py-2 text-linho transition-opacity disabled:opacity-60"
            >
              {salvar.isPending ? 'Salvando…' : tarefa ? 'Salvar' : 'Criar tarefa'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-botao px-4 py-2 text-verde-suave hover:bg-linho-escuro"
            >
              Cancelar
            </button>
            {tarefa &&
              (confirmarExclusao ? (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => excluir.mutate(tarefa.id, { onSuccess: onClose })}
                  className="ml-auto rounded-botao bg-tinta px-4 py-2 text-linho disabled:opacity-60"
                >
                  {excluir.isPending ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmarExclusao(true)}
                  className="ml-auto rounded-botao px-4 py-2 text-verde hover:bg-vela-claro"
                >
                  Excluir tarefa
                </button>
              ))}
          </div>
        </form>
      </div>
    </div>
  );
}
