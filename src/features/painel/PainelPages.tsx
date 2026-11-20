import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '../../components/NotFoundPage';
import { formatDataCurta } from '../../lib/date';
import { formatarCentavos } from '../../lib/dinheiro';
import { useResumo } from '../convidados/useConvidados';
import { useDashboard } from '../financeiro/useFinanceiro';
import { estaAtrasada, RESPONSAVEIS, useQuadro, type Quadro } from '../tarefas/useTarefas';
import { MODULOS_PAINEL } from './modulos';

const PROXIMAS = 6;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const fracao = (parte: number, todo: number) => `${todo > 0 ? Math.min(100, Math.round((parte / todo) * 100)) : 0}%`;

function Indicador(props: { to: string; titulo: string; valor: ReactNode; progresso: string; children: ReactNode }) {
  return (
    <Link to={props.to} className="cartao-painel block transition-colors hover:border-folha-escuro">
      <p className="text-sm font-medium text-verde-suave">{props.titulo}</p>
      <p className="mt-1 font-display text-4xl text-verde">{props.valor}</p>
      <div className="barra mt-4" aria-hidden="true">
        <span style={{ width: props.progresso }} />
      </div>
      <p className="mt-2 text-sm text-verde-suave">{props.children}</p>
    </Link>
  );
}

function IndicadorConvidados() {
  const { data } = useResumo();
  if (!data) return null;
  return (
    <Indicador
      to="/painel/convidados"
      titulo="Confirmados"
      valor={`${data.porRsvp.vai} de ${data.pessoas}`}
      progresso={fracao(data.porRsvp.vai, data.pessoas)}
    >
      {data.porRsvp.sem_resposta} sem resposta
    </Indicador>
  );
}

function tarefasAbertas(q: Quadro) {
  return q.colunas
    .filter((c) => !c.concluida)
    .flatMap((c) => c.tarefas.map((t) => ({ t, atrasada: estaAtrasada(t, c, q.hoje) })));
}

function IndicadorTarefas() {
  const { data } = useQuadro('todas');
  if (!data) return null;
  const abertas = tarefasAbertas(data);
  const total = data.colunas.reduce((n, c) => n + c.tarefas.length, 0);
  const atrasadas = abertas.filter((a) => a.atrasada).length;
  return (
    <Indicador
      to="/painel/tarefas"
      titulo="Tarefas abertas"
      valor={abertas.length}
      progresso={fracao(total - abertas.length, total)}
    >
      {atrasadas > 0 ? (
        <span className="font-semibold text-erro">{plural(atrasadas, 'atrasada', 'atrasadas')}</span>
      ) : (
        'Nenhuma atrasada'
      )}
    </Indicador>
  );
}

function IndicadorFinanceiro() {
  const { data } = useDashboard();
  if (!data) return null;
  const { pagoCentavos, contratadoCentavos } = data.totais;
  return (
    <Indicador
      to="/painel/financeiro"
      titulo="Pago"
      valor={formatarCentavos(pagoCentavos)}
      progresso={fracao(pagoCentavos, contratadoCentavos)}
    >
      de {formatarCentavos(contratadoCentavos)} contratados
    </Indicador>
  );
}

function Bloco({ titulo, to, children }: { titulo: string; to: string; children: ReactNode }) {
  return (
    <section className="cartao-painel p-0">
      <div className="flex items-baseline justify-between border-b border-folha px-5 py-3">
        <h2>{titulo}</h2>
        <Link to={to} className="acao-link text-sm">
          Ver tudo
        </Link>
      </div>
      {children}
    </section>
  );
}

function Linha({ data, atrasada, texto, fim }: { data: string; atrasada: boolean; texto: string; fim: ReactNode }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <span className={`w-24 shrink-0 text-sm tabular-nums ${atrasada ? 'font-semibold text-erro' : 'text-verde-suave'}`}>
        {formatDataCurta(data)}
      </span>
      <span className="min-w-0 flex-1 truncate">{texto}</span>
      <span className="shrink-0 text-sm">{fim}</span>
    </li>
  );
}

const nomeResponsavel = (valor: string) => RESPONSAVEIS.find((r) => r.valor === valor)?.label ?? valor;

function ProximasTarefas() {
  const { data } = useQuadro('todas');
  if (!data) return null;
  const proximas = tarefasAbertas(data)
    .filter(({ t }) => t.prazo)
    .sort((a, b) => (a.t.prazo ?? '').localeCompare(b.t.prazo ?? ''))
    .slice(0, PROXIMAS);
  return (
    <Bloco titulo="Próximas tarefas" to="/painel/tarefas">
      {proximas.length === 0 ? (
        <p className="px-5 py-4 text-verde-suave">Nenhuma tarefa com prazo.</p>
      ) : (
        <ul className="divide-y divide-folha">
          {proximas.map(({ t, atrasada }) => (
            <Linha
              key={t.id}
              data={t.prazo ?? ''}
              atrasada={atrasada}
              texto={t.titulo}
              fim={<span className="text-verde-suave">{nomeResponsavel(t.responsavel)}</span>}
            />
          ))}
        </ul>
      )}
    </Bloco>
  );
}

function ProximosPagamentos() {
  const { data } = useDashboard();
  if (!data) return null;
  const parcelas = [...data.atrasadas, ...data.proximosVencimentos].slice(0, PROXIMAS);
  return (
    <Bloco titulo="Pagamentos" to="/painel/financeiro">
      {parcelas.length === 0 ? (
        <p className="px-5 py-4 text-verde-suave">Nenhum vencimento nos próximos 30 dias.</p>
      ) : (
        <ul className="divide-y divide-folha">
          {parcelas.map((p) => (
            <Linha
              key={p.id}
              data={p.vencimento}
              atrasada={p.atrasada}
              texto={p.contratoDescricao}
              fim={<span className="num font-semibold">{formatarCentavos(p.valorCentavos)}</span>}
            />
          ))}
        </ul>
      )}
    </Bloco>
  );
}

export function PainelHomePage() {
  return (
    <section>
      <h1>Visão geral</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <IndicadorConvidados />
        <IndicadorTarefas />
        <IndicadorFinanceiro />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ProximasTarefas />
        <ProximosPagamentos />
      </div>
    </section>
  );
}

export function PainelModuloPage() {
  const { modulo } = useParams();
  const info = MODULOS_PAINEL.find((m) => m.slug === modulo);
  if (!info) return <NotFoundPage embedded />;

  return (
    <section>
      <h1>{info.label}</h1>
      <p className="mt-3 text-verde-suave">Em breve.</p>
    </section>
  );
}
