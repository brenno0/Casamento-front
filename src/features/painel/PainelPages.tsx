import { Link, useParams } from 'react-router';
import { NotFoundPage } from '../../components/NotFoundPage';
import { MODULOS_PAINEL } from './modulos';

const RESUMO_MODULO: Record<string, string> = {
  tarefas: 'O quadro com tudo o que falta fazer, e quem faz.',
  fornecedores: 'Contatos, orçamentos e em que pé está cada um.',
  financeiro: 'Previsto, contratado e pago, com os próximos vencimentos.',
  viagens: 'Roteiro, reservas e mala de cada viagem.',
  convidados: 'Grupos, convites enviados e confirmações de presença.',
  presentes: 'A lista que os convidados veem e o que já chegou.',
  mural: 'Os recados deixados pelos convidados.',
  site: 'História, locais, dress code, galeria e dúvidas do site.',
  roteiro: 'O passo a passo do dia do casamento.',
};

export function PainelHomePage() {
  return (
    <section>
      <h1 className="text-4xl sm:text-5xl">Visão geral</h1>
      <p className="mt-3 text-lg text-verde-suave">Tudo do casamento em um só lugar. Por onde vocês querem começar?</p>
      <ul className="mt-12 grid border-t border-folha-escuro sm:grid-cols-2 sm:gap-x-12">
        {MODULOS_PAINEL.map((m) => (
          <li key={m.slug} className="border-b border-folha-escuro">
            <Link to={`/painel/${m.slug}`} className="group block py-6">
              <span className="font-caslon text-2xl text-verde decoration-1 underline-offset-4 group-hover:underline">{m.label}</span>
              {RESUMO_MODULO[m.slug] && <span className="mt-1 block text-verde-suave">{RESUMO_MODULO[m.slug]}</span>}
            </Link>
          </li>
        ))}
      </ul>
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
