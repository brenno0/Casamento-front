import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../../lib/api';
import { destinoSeguro, useLogin, useSessao } from './useSessao';

function mensagemDeErro(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return 'E-mail ou senha incorretos.';
  if (error instanceof ApiError && error.status === 400) return 'Preencha e-mail e senha.';
  return 'Não foi possível entrar agora. Tente novamente em instantes.';
}

const inputClass =
  'campo';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const destino = destinoSeguro(searchParams.get('next'));
  const navigate = useNavigate();
  const { data: conta } = useSessao();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  if (conta && !login.isSuccess) return <Navigate to={destino} replace />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate(
      { email: email.trim(), senha },
      { onSuccess: () => void navigate(destino, { replace: true }) },
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-linho px-gutter">
      <section className="cartao-mesa w-full max-w-md px-8 py-12 sm:px-12">
        <h1 className="text-5xl">Entrar</h1>
        <p className="mt-2 text-lg text-verde-suave">Painel do casal</p>

        <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
          <label className="block">
            <span className="text-sm font-medium text-verde-suave">E-mail</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-verde-suave">Senha</span>
            <input
              type="password"
              name="senha"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputClass}
            />
          </label>

          {login.isError && (
            <p className="text-erro" role="alert">
              {mensagemDeErro(login.error)}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending || email.trim() === '' || senha === ''}
            className="botao w-full"
          >
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
