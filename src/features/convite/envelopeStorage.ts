const chave = (token: string) => `envelope-aberto:${token}`;

/** Já abriu o envelope deste convite nesta sessão do navegador? */
export function envelopeJaAberto(token: string): boolean {
  try {
    return sessionStorage.getItem(chave(token)) === '1';
  } catch {
    return false;
  }
}

export function marcarAberto(token: string): void {
  try {
    sessionStorage.setItem(chave(token), '1');
  } catch {
    // Sem storage (modo privado): só reaparece no próximo acesso.
  }
}

