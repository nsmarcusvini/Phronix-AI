// Destino interno apenas: evita redirecionar para fora do app (open redirect).
export function destinoSeguro(proximo: string | null | undefined, padrao = "/painel") {
  return proximo && proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : padrao;
}
