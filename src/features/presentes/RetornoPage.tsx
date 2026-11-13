import { Link } from 'react-router';

/**
 * Volta do Mercado Pago. O retorno do navegador não confirma nada: só o webhook
 * marca o presente como pago.
 */
export function RetornoPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-marfim px-gutter text-center">
      <p className="font-script text-5xl text-rosa-antigo-escuro">Obrigado pelo carinho!</p>
      <p className="mt-6 max-w-md">
        Estamos confirmando o seu presente com o Mercado Pago. Assim que o pagamento for aprovado, ele aparece para o casal
        automaticamente.
      </p>
      <Link to="/" className="mt-8 rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim">
        Voltar ao site
      </Link>
    </main>
  );
}
