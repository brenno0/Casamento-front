import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '../../components/NotFoundPage';
import { formatDataCurta } from '../../lib/date';
import { formatarCentavos } from '../../lib/dinheiro';
import { useResumo } from '../convidados/useConvidados';
import { useDashboard } from '../financeiro/useFinanceiro';
import { estaAtrasada, RESPONSAVEIS, useQuadro, type Quadro } from '../tarefas/useTarefas';
import { Avatar } from './Avatar';
import { IconePainel, type NomeIconePainel } from './IconePainel';
import { MODULOS_PAINEL } from './modulos';

const PROXIMAS = 6;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const fracao = (parte: number, todo: number) => `${todo > 0 ? Math.min(100, Math.round((parte / todo) * 100)) : 0}%`;

interface IndicadorProps {
  to: string;
  icone: NomeIconePainel;
  titulo: string;
  valor: ReactNode;
  progresso: string;
  children: ReactNode;
}

function Indicador({ to, icone, titulo, valor, progresso, children }: IndicadorProps) {
  return (
    <Link to={to} className="bandeja group">
      <span className="bandeja-rotulo">
        <IconePainel nome={icone} />
        {titulo}
        <IconePainel
          nome="abrir"
          className="ml-auto size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
      </span>
      <span className="cartao-painel block">
        <span className="numero block">{valor}</span>
        <span className="mt-2 block text-[0.8125rem] text-grafite-suave">{children}</span>
        <span className="barra tracos mt-4 block" aria-hidden="true">
          <span style={{ width: progresso }} />
        </span>
      </span>
    </Link>
  );
}

const Parte = ({ children }: { children: ReactNode }) => <span className="text-grafite-suave/60">{children}</span>;

function IndicadorConvidados() {
  const { data } = useResumo();
  if (!data) return null;
  return (
    <Indicador
      to="/painel/convidados"
      icone="convidados"
      titulo="Confirmados"
      valor={
        <>
          {data.porRsvp.vai}
          <Parte>/{data.pessoas}</Parte>
        </>
      }
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
      icone="tarefas"
      titulo="Tarefas abertas"
      valor={
        <>
          {abertas.length}
          <Parte>/{total}</Parte>
        </>
      }
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
      icone="financeiro"
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
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2>{titulo}</h2>
        <Link to={to} className="acao-secundaria min-h-8 px-3 text-[0.8125rem]">
          Ver tudo
          <IconePainel nome="abrir" className="size-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Linha({ data, atrasada, texto, fim }: { data: string; atrasada: boolean; texto: string; fim: ReactNode }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3 transition-colors duration-150 hover:bg-nevoa/80">
      <span className="min-w-0 flex-1 truncate font-medium">{texto}</span>
      <span className="shrink-0 text-sm">{fim}</span>
      <span className={`w-16 shrink-0 text-right text-[0.8125rem] tabular-nums ${atrasada ? 'font-medium text-erro' : 'text-grafite-suave'}`}>
        {formatDataCurta(data)}
      </span>
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
        <p className="px-5 py-4 text-grafite-suave">Nenhuma tarefa com prazo.</p>
      ) : (
        <ul className="divide-y divide-linha pb-2">
          {proximas.map(({ t, atrasada }) => (
            <Linha
              key={t.id}
              data={t.prazo ?? ''}
              atrasada={atrasada}
              texto={t.titulo}
              fim={
                <>
                  <Avatar nome={nomeResponsavel(t.responsavel)} />
                  <span className="sr-only">{nomeResponsavel(t.responsavel)}</span>
                </>
              }
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
        <p className="px-5 py-4 text-grafite-suave">Nenhum vencimento nos próximos 30 dias.</p>
      ) : (
        <ul className="divide-y divide-linha pb-2">
          {parcelas.map((p) => (
            <Linha
              key={p.id}
              data={p.vencimento}
              atrasada={p.atrasada}
              texto={p.contratoDescricao}
              fim={<span className="num font-medium">{formatarCentavos(p.valorCentavos)}</span>}
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
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <IndicadorConvidados />
        <IndicadorTarefas />
        <IndicadorFinanceiro />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
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
      <p className="mt-3 text-grafite-suave">Em breve.</p>
    </section>
  );
}
