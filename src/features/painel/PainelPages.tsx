import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '../../components/NotFoundPage';
import { formatDataCurta } from '../../lib/date';
import { formatarCentavos } from '../../lib/dinheiro';
import { useResumo } from '../convidados/useConvidados';
import { useDashboard } from '../financeiro/useFinanceiro';
import { estaAtrasada, useQuadro } from '../tarefas/useTarefas';
import { MODULOS_PAINEL } from './modulos';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function Indicador({ to, titulo, valor, children }: { to: string; titulo: string; valor: ReactNode; children?: ReactNode }) {
  return (
    <Link to={to} className="cartao-painel block transition-colors hover:border-folha-escuro">
      <h2 className="font-sans text-sm font-medium text-verde-suave">{titulo}</h2>
      <p className="mt-2 font-display text-4xl text-verde">{valor}</p>
      {children && <p className="mt-2 text-sm text-verde-suave">{children}</p>}
    </Link>
  );
}

function IndicadorConvidados() {
  const { data } = useResumo();
  if (!data) return null;
  return (
    <Indicador to="/painel/convidados" titulo="Confirmados" valor={`${data.porRsvp.vai} de ${data.pessoas}`}>
      {data.porRsvp.sem_resposta} sem resposta
    </Indicador>
  );
}

function IndicadorTarefas() {
  const { data } = useQuadro('todas');
  if (!data) return null;
  const abertas = data.colunas.filter((c) => !c.concluida).flatMap((c) => c.tarefas.map((t) => ({ t, c })));
  const atrasadas = abertas.filter(({ t, c }) => estaAtrasada(t, c, data.hoje)).length;
  return (
    <Indicador to="/painel/tarefas" titulo="Tarefas abertas" valor={abertas.length}>
      {atrasadas > 0 ? <span className="font-semibold text-erro">{plural(atrasadas, 'atrasada', 'atrasadas')}</span> : 'Nenhuma atrasada'}
    </Indicador>
  );
}

function IndicadorFinanceiro() {
  const { data } = useDashboard();
  if (!data) return null;
  const proxima = data.proximosVencimentos[0];
  return (
    <Indicador to="/painel/financeiro" titulo="Pago" valor={formatarCentavos(data.totais.pagoCentavos)}>
      {data.atrasadas.length > 0 ? (
        <span className="font-semibold text-erro">{plural(data.atrasadas.length, 'parcela atrasada', 'parcelas atrasadas')}</span>
      ) : proxima ? (
        `Próximo vencimento ${formatDataCurta(proxima.vencimento)}`
      ) : (
        `de ${formatarCentavos(data.totais.contratadoCentavos)} contratados`
      )}
    </Indicador>
  );
}

export function PainelHomePage() {
  return (
    <section>
      <h1 className="text-4xl sm:text-5xl">Visão geral</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <IndicadorConvidados />
        <IndicadorTarefas />
        <IndicadorFinanceiro />
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
      <h1 className="text-4xl sm:text-5xl">{info.label}</h1>
      <p className="mt-3 text-verde-suave">Em breve.</p>
    </section>
  );
}
