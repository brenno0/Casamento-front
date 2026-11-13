import { linkConvite, montarTexto, urlWhatsApp } from '../../lib/whatsapp';
import { useSitePainel } from '../site-admin/useSiteAdmin';
import { useMarcarEnviado, type Grupo } from './useConvidados';

/**
 * Botões do WhatsApp de um grupo: "Enviar convite" (marca o grupo como enviado)
 * e, para quem ainda não respondeu, "Lembrar" (não muda o estado).
 */
export function BotoesWhatsApp({ g, lembrete }: { g: Grupo; lembrete: boolean }) {
  const { data: site } = useSitePainel();
  const marcar = useMarcarEnviado();
  if (!site) return null;

  const contato = g.convidados.find((c) => c.id === g.contatoConvidadoId) ?? null;
  const dados = { grupo: g.nome, link: linkConvite(g.token), prazo: site.config.rsvpPrazo };
  const abrir = (modelo: string) => window.open(urlWhatsApp(contato?.telefone, montarTexto(modelo, dados)), '_blank', 'noopener');
  const faltaResponder = g.convidados.some((c) => c.rsvp === 'sem_resposta');

  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        aria-label={`Enviar convite pelo WhatsApp para ${g.nome}`}
        onClick={() => {
          abrir(site.config.mensagemConvite);
          marcar.mutate(g.id);
        }}
        className="rounded-pill bg-salvia-escuro px-3 py-1 text-marfim"
      >
        {g.statusEnvio === 'enviado' ? 'Reenviar convite' : 'Enviar convite'}
      </button>
      {lembrete && faltaResponder && (
        <button
          type="button"
          aria-label={`Lembrar ${g.nome} pelo WhatsApp`}
          onClick={() => abrir(site.config.mensagemLembrete)}
          className="rounded-pill border border-salvia-escuro px-3 py-1 text-salvia-escuro"
        >
          Lembrar
        </button>
      )}
      {g.statusEnvio === 'enviado' && g.enviadoEm && (
        <span className="text-grafite-suave">Enviado em {new Date(g.enviadoEm).toLocaleDateString('pt-BR')}</span>
      )}
      {!contato && <span className="text-grafite-suave">(sem contato: escolha no WhatsApp)</span>}
    </span>
  );
}
