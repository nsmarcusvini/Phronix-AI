import type { Kit } from "@/lib/domain";

export const ABERTAS_NO_GRATIS = 8;

// No produto, o servidor manda qa_items.bloqueado e o RLS esconde a resposta.
// Para o teaser funcionar, o back precisa expor pergunta e categoria das
// bloqueadas (pendência anotada). No demo, simulamos pela posição no mapa.
export function bloqueada(kit: Kit, posicaoNoMapa: number) {
  return kit.acesso === "gratis" && posicaoNoMapa >= ABERTAS_NO_GRATIS;
}
