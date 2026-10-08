import "server-only";

// Limite simples por chave (usuário), em memória, por instância do servidor.
// Basta para o beta; em produção com várias instâncias, trocar por um
// armazenamento compartilhado (ex.: Upstash Redis).

const janelas = new Map<string, number[]>();

export function dentroDoLimite(chave: string, maximo: number, janelaMs: number) {
  const agora = Date.now();
  const recentes = (janelas.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (recentes.length >= maximo) {
    janelas.set(chave, recentes);
    return false;
  }
  recentes.push(agora);
  janelas.set(chave, recentes);
  return true;
}
