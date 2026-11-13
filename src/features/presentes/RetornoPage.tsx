import { Link } from 'react-router';

/**
 * Volta do Mercado Pago. O retorno do navegador não confirma nada: só o webhook
 * marca o presente como pago.
 */
export function RetornoPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-linho px-gutter text-center">
      <div className="cartao-mesa max-w-xl px-8 py-14 sm:px-14">
        <h1 className="text-4xl sm:text-5xl">Obrigado pelo carinho!</h1>
        <p className="mt-6 text-lg text-verde-suave">
          Estamos confirmando o seu presente com o Mercado Pago. Assim que o pagamento for aprovado, ele aparece para o casal
          automaticamente.
        </p>
        <Link to="/" className="botao mt-10">
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
