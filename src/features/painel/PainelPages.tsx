import { useParams } from 'react-router';
import { NotFoundPage } from '../../components/NotFoundPage';
import { MODULOS_PAINEL } from './modulos';

export function PainelHomePage() {
  return (
    <section>
      <h1 className="text-4xl">Visão geral</h1>
      <p className="mt-3 text-grafite-suave">Os módulos do painel aparecem aqui conforme forem construídos.</p>
    </section>
  );
}

export function PainelModuloPage() {
  const { modulo } = useParams();
  const info = MODULOS_PAINEL.find((m) => m.slug === modulo);
  if (!info) return <NotFoundPage embedded />;

  return (
    <section>
      <h1 className="text-4xl">{info.label}</h1>
      <p className="mt-3 text-grafite-suave">Em breve.</p>
    </section>
  );
}
