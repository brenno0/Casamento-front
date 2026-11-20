import { useEffect, useState } from 'react';

/** Devolve `valor` só depois de `ms` sem mudanças (ex.: busca que não dispara a cada tecla). */
export function useAdiado<T>(valor: T, ms: number): T {
  const [adiado, setAdiado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setAdiado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return adiado;
}
