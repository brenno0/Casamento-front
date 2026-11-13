import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FileUpload } from '../../components/FileUpload';
import { ApiError } from '../../lib/api';
import { formatDataCurta } from '../../lib/date';
import { formatarCentavos, parseCentavos } from '../../lib/dinheiro';
import { urlArquivo } from '../../lib/upload';
import { BadgeStatus, inputClass } from './FornecedoresPage';
import {
  PROXIMOS,
  RESPONSAVEIS_FORNECEDOR,
  labelStatus,
  useAtualizarFornecedor,
  useCriarOrcamento,
  useExcluirFornecedor,
  useExcluirOrcamento,
  useFornecedor,
  useMudarStatus,
  type FornecedorDetalhe,
  type ResponsavelFornecedor,
} from './useFornecedores';

export function FornecedorDetalhePage() {
  const id = Number(useParams().id);
  const { data, isPending, isError } = useFornecedor(id);

  if (isPending) {
    return (
      <p role="status" className="text-verde-suave">
        Carregando…
      </p>
    );
  }
  if (isError || !data) {
    return (
      <p role="alert" className="text-erro">
        Fornecedor não encontrado. <Link to="/painel/fornecedores" className="underline">Voltar</Link>
      </p>
    );
  }
  return <Detalhe key={`${data.id}`} f={data} />;
}

function Detalhe({ f }: { f: FornecedorDetalhe }) {
  const mudar = useMudarStatus(f.id);
  const atualizar = useAtualizarFornecedor(f.id);
  // Fica no pai: o formulário remonta com os dados salvos e o "Salvo." continua visível.
  const salvarDados = useAtualizarFornecedor(f.id);
  const excluir = useExcluirFornecedor();
  const navigate = useNavigate();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section className="space-y-8">
      <div>
        <Link to="/painel/fornecedores" className="text-sm text-verde-suave underline">
          ← Fornecedores
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl">{f.nome}</h1>
          <BadgeStatus status={f.status} />
        </div>
        <p className="text-verde-suave">{f.categoria}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Mudar status">
        {PROXIMOS[f.status].map((s) => (
          <button
            key={s}
            type="button"
            disabled={mudar.isPending}
            onClick={() => mudar.mutate(s)}
            className={`rounded-botao px-4 py-1 disabled:opacity-60 ${
              s === 'descartado' ? 'border border-verde text-verde' : 'bg-verde text-linho'
            }`}
          >
            Marcar como {labelStatus(s).toLowerCase()}
          </button>
        ))}
        {mudar.isError && (
          <p role="alert" className="text-erro">
            Não foi possível mudar o status.
          </p>
        )}
      </div>

      <DadosForm
        key={[f.nome, f.categoria, f.telefone, f.email, f.site, f.observacoes, f.responsavel].join('|')}
        f={f}
        atualizar={salvarDados}
      />

      <section aria-labelledby="contrato-titulo" className="rounded-card border border-folha bg-white p-4">
        <h2 id="contrato-titulo" className="text-2xl">
          Contrato
        </h2>
        {f.contrato ? (
          <p className="mt-2">
            <a href={urlArquivo(f.contrato.id)} target="_blank" rel="noreferrer" className="text-verde underline">
              {f.contrato.nomeOriginal}
            </a>
            <button
              type="button"
              onClick={() => atualizar.mutate({ contratoArquivoId: null })}
              className="ml-3 text-sm text-verde-suave underline"
            >
              Remover
            </button>
          </p>
        ) : (
          <p className="mt-2 text-verde-suave">Nenhum contrato anexado.</p>
        )}
        <div className="mt-3">
          <FileUpload
            label="Enviar contrato (PDF)"
            accept="application/pdf"
            onEnviado={(a) => atualizar.mutate({ contratoArquivoId: a.id })}
          />
        </div>
        {atualizar.isError && atualizar.error instanceof ApiError && atualizar.error.code === 'CONTRATO_DEVE_SER_PDF' && (
          <p role="alert" className="mt-1 text-sm text-erro">
            O contrato deve ser um PDF.
          </p>
        )}
      </section>

      <Orcamentos f={f} />

      <section aria-labelledby="tarefas-titulo">
        <h2 id="tarefas-titulo" className="text-2xl">
          Tarefas vinculadas
        </h2>
        {f.tarefas.length === 0 ? (
          <p className="mt-2 text-verde-suave">Nenhuma. Vincule pelo quadro de tarefas.</p>
        ) : (
          <ul className="mt-2 list-disc pl-6">
            {f.tarefas.map((t) => (
              <li key={t.id}>{t.titulo}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="border-t border-folha pt-4">
        {confirmando ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={excluir.isPending}
              onClick={() => excluir.mutate(f.id, { onSuccess: () => void navigate('/painel/fornecedores') })}
              className="rounded-botao bg-verde px-4 py-1 text-linho"
            >
              Confirmar exclusão
            </button>
            <button type="button" onClick={() => setConfirmando(false)} className="px-4 py-1 text-verde-suave">
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmando(true)} className="text-verde underline">
            Excluir fornecedor
          </button>
        )}
        {excluir.isError && (
          <p role="alert" className="mt-1 text-erro">
            Não foi possível excluir.
          </p>
        )}
      </div>
    </section>
  );
}

function DadosForm({
  f,
  atualizar,
}: {
  f: FornecedorDetalhe;
  atualizar: ReturnType<typeof useAtualizarFornecedor>;
}) {
  const [dados, setDados] = useState({
    nome: f.nome,
    categoria: f.categoria,
    telefone: f.telefone ?? '',
    email: f.email ?? '',
    site: f.site ?? '',
    observacoes: f.observacoes ?? '',
    responsavel: f.responsavel,
  });

  function campo<K extends keyof typeof dados>(k: K, v: (typeof dados)[K]) {
    atualizar.reset();
    setDados((d) => ({ ...d, [k]: v }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    atualizar.mutate({
      nome: dados.nome.trim(),
      categoria: dados.categoria.trim(),
      telefone: dados.telefone.trim() || null,
      email: dados.email.trim() || null,
      site: dados.site.trim() || null,
      observacoes: dados.observacoes.trim() || null,
      responsavel: dados.responsavel,
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate aria-label="Dados do fornecedor">
      <label className="block">
        <span className="text-sm text-verde-suave">Nome</span>
        <input maxLength={120} value={dados.nome} onChange={(e) => campo('nome', e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-verde-suave">Categoria</span>
        <input maxLength={60} value={dados.categoria} onChange={(e) => campo('categoria', e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-verde-suave">Telefone</span>
        <input type="tel" value={dados.telefone} onChange={(e) => campo('telefone', e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-verde-suave">E-mail</span>
        <input type="email" value={dados.email} onChange={(e) => campo('email', e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-verde-suave">Site ou Instagram</span>
        <input value={dados.site} onChange={(e) => campo('site', e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm text-verde-suave">Responsável</span>
        <select
          value={dados.responsavel}
          onChange={(e) => campo('responsavel', e.target.value as ResponsavelFornecedor)}
          className={inputClass}
        >
          {RESPONSAVEIS_FORNECEDOR.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm text-verde-suave">Observações</span>
        <textarea rows={3} value={dados.observacoes} onChange={(e) => campo('observacoes', e.target.value)} className={inputClass} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={!dados.nome.trim() || !dados.categoria.trim() || atualizar.isPending}
          className="rounded-botao bg-verde px-6 py-2 text-linho disabled:opacity-60"
        >
          Salvar dados
        </button>
        {atualizar.isSuccess && <span role="status">Salvo.</span>}
        {atualizar.isError && (
          <span role="alert" className="text-erro">
            Não foi possível salvar. Confira os campos.
          </span>
        )}
      </div>
    </form>
  );
}

function Orcamentos({ f }: { f: FornecedorDetalhe }) {
  const criar = useCriarOrcamento(f.id);
  const excluir = useExcluirOrcamento(f.id);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [arquivoId, setArquivoId] = useState<number | null>(null);
  const valorCentavos = parseCentavos(valor);
  const valido = descricao.trim() !== '' && valorCentavos !== null && valorCentavos > 0 && data !== '';
  const menor = f.orcamentos[0]?.valorCentavos;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido) return;
    criar.mutate(
      { descricao: descricao.trim(), valorCentavos: valorCentavos!, data, arquivoId },
      {
        onSuccess: () => {
          setDescricao('');
          setValor('');
          setData('');
          setArquivoId(null);
        },
      },
    );
  }

  return (
    <section aria-labelledby="orcamentos-titulo">
      <h2 id="orcamentos-titulo" className="text-2xl">
        Orçamentos
      </h2>
      {f.orcamentos.length === 0 ? (
        <p className="mt-2 text-verde-suave">Nenhum orçamento ainda.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-verde-suave">
              <tr>
                <th className="py-1 pr-4">Descrição</th>
                <th className="py-1 pr-4">Data</th>
                <th className="py-1 pr-4">Valor</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {f.orcamentos.map((o) => {
                const maisBarato = o.valorCentavos === menor;
                return (
                  <tr key={o.id} className={maisBarato ? 'bg-folha-claro' : ''} aria-label={maisBarato ? 'Menor orçamento' : undefined}>
                    <td className="py-2 pr-4">
                      {o.descricao}
                      {o.arquivo && (
                        <a href={urlArquivo(o.arquivo.id)} target="_blank" rel="noreferrer" className="ml-2 text-sm underline">
                          anexo
                        </a>
                      )}
                    </td>
                    <td className="py-2 pr-4">{formatDataCurta(o.data)}</td>
                    <td className="py-2 pr-4 font-semibold">
                      {formatarCentavos(o.valorCentavos)}
                      {maisBarato && <span className="ml-2 text-sm font-normal text-musgo">menor</span>}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        aria-label={`Excluir orçamento ${o.descricao}`}
                        onClick={() => excluir.mutate(o.id)}
                        className="text-sm text-verde underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-4" noValidate aria-label="Novo orçamento">
        <label className="block sm:col-span-2">
          <span className="text-sm text-verde-suave">Descrição</span>
          <input maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-verde-suave">Valor (R$)</span>
          <input inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-verde-suave">Data</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputClass} />
        </label>
        <div className="sm:col-span-3">
          <FileUpload label="Anexo (opcional)" onEnviado={(a) => setArquivoId(a.id)} />
          {arquivoId && <p className="text-sm text-musgo">Anexo pronto.</p>}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!valido || criar.isPending}
            className="w-full rounded-botao bg-verde px-4 py-2 text-linho disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>
        {valor !== '' && valorCentavos === null && (
          <p role="alert" className="text-sm text-erro sm:col-span-4">
            Valor inválido. Use o formato 1.234,56.
          </p>
        )}
        {criar.isError && (
          <p role="alert" className="text-sm text-erro sm:col-span-4">
            Não foi possível adicionar o orçamento.
          </p>
        )}
      </form>
    </section>
  );
}
