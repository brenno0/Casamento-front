import { useParams } from 'react-router';
import { ApiError } from '../../lib/api';
import { Carregando } from '../site/HomePage';
import { SitePage } from '../site/SitePage';
import { useSiteConvite, useSitePublico } from '../site/useSite';

/**
 * Site pela camada convite (`/c/:token`). Token inválido cai na camada pública,
 * com um aviso discreto.
 */
export function ConvitePage() {
  const token = useParams().token ?? '';
  const convite = useSiteConvite(token);
  const invalido = convite.error instanceof ApiError && convite.error.status === 404;
  const publico = useSitePublico(invalido);

  if (convite.data) return <SitePage camada="convite" site={convite.data} />;
  if (invalido && publico.data) {
    return (
      <SitePage
        camada="publico"
        site={publico.data}
        aviso={
          <p role="status" className="bg-rosa-antigo-claro px-gutter py-2 text-center text-sm text-rosa-antigo-escuro">
            Não encontramos este convite. Confira o link que você recebeu; abaixo está o site aberto.
          </p>
        }
      />
    );
  }
  return <Carregando erro={(convite.isError && !invalido) || publico.isError} />;
}
