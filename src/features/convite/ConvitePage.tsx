import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ApiError } from '../../lib/api';
import { Carregando } from '../site/HomePage';
import { SitePage } from '../site/SitePage';
import { useSiteConvite, useSitePublico } from '../site/useSite';
import { MuralSection } from '../mural/MuralSection';
import { Envelope } from './Envelope';
import { envelopeJaAberto } from './envelopeStorage';
import { RsvpSection } from './RsvpSection';

/**
 * Site pela camada convite (`/c/:token`): envelope com o nome do grupo, depois o site
 * com endereços, mapa e RSVP. Token inválido cai na camada pública, com aviso discreto.
 */
export function ConvitePage() {
  const token = useParams().token ?? '';
  const convite = useSiteConvite(token);
  const invalido = convite.error instanceof ApiError && convite.error.status === 404;
  const publico = useSitePublico(invalido);
  const [aberto, setAberto] = useState(() => envelopeJaAberto(token));
  const nomeGrupo = convite.data?.grupo.nome ?? '';
  // Slots estáveis: abrir o envelope não refaz o site inteiro (SitePage é memo).
  const slots = useMemo(
    () => ({ rsvp: <RsvpSection token={token} />, mural: <MuralSection token={token} nomePadrao={nomeGrupo} /> }),
    [token, nomeGrupo],
  );

  if (convite.data) {
    return (
      <>
        {!aberto && <Envelope token={token} nomeGrupo={convite.data.grupo.nome} onAberto={() => setAberto(true)} />}
        <div aria-hidden={!aberto || undefined}>
          <SitePage
            camada="convite"
            site={convite.data}
            slots={slots}
          />
        </div>
      </>
    );
  }
  if (invalido && publico.data) {
    return (
      <SitePage
        camada="publico"
        site={publico.data}
        aviso={
          <p role="status" className="bg-vela-claro px-gutter py-3 text-center text-verde">
            Não encontramos este convite. Confira o link que você recebeu; abaixo está o site aberto.
          </p>
        }
      />
    );
  }
  return <Carregando erro={(convite.isError && !invalido) || publico.isError} />;
}
