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
  'mt-1 block w-full rounded-card border border-dourado-claro bg-white px-4 py-2 text-grafite focus:border-dourado';

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
    <main className="flex min-h-svh items-center justify-center bg-marfim px-gutter">
      <section className="w-full max-w-sm rounded-card bg-white/70 p-8 shadow-suave">
        <h1 className="text-center font-script text-5xl text-rosa-antigo-escuro">Entrar</h1>
        <p className="mt-2 text-center text-grafite-suave">Painel do casal</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <label className="block">
            <span className="text-sm text-grafite-suave">E-mail</span>
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
            <span className="text-sm text-grafite-suave">Senha</span>
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
            <p className="text-rosa-antigo-escuro" role="alert">
              {mensagemDeErro(login.error)}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending || email.trim() === '' || senha === ''}
            className="w-full rounded-pill bg-rosa-antigo-escuro px-6 py-2 text-marfim transition-opacity disabled:opacity-60"
          >
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
