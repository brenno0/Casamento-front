import { HomePage } from '../site/HomePage';

/**
 * Site pela camada convite (`/c/:token`). Por enquanto mostra o mesmo site público;
 * a validação do token e o conteúdo exclusivo chegam em histórias futuras.
 */
export function ConvitePage() {
  return <HomePage />;
}
