import type { QaItem } from "@/lib/domain";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import { ABERTAS_NO_GRATIS } from "@/lib/mapa/bloqueio";

const NOME_CATEGORIA = new Map(CATEGORIAS.map((c) => [c.id, c.nome]));

// Gatilho de upgrade: a pergunta aparece, a resposta não. As linhas abaixo são
// só forma; nenhum texto da resposta chega à tela.
export function Bloqueada({
  item,
  restantes,
  onVoltar,
}: {
  item: QaItem;
  restantes: number;
  onVoltar: () => void;
}) {
  return (
    <article key={item.id} className="animate-revelar">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onVoltar} className="text-rotulo text-cinza-quente hover:text-osso lg:hidden">
          ← Mapa
        </button>
        <p className="text-rotulo text-cinza-quente">{NOME_CATEGORIA.get(item.categoria)} · fechada</p>
      </div>

      <h2 className="mt-6 font-display text-display-lg font-medium text-balance">{item.pergunta}</h2>

      <div aria-hidden className="mt-10 space-y-4">
        {[92, 100, 76, 84].map((largura, i) => (
          <div key={i} className="h-3 rounded-full bg-grafite" style={{ width: `${largura}%` }} />
        ))}
      </div>

      <div className="mt-14 border-t border-fio pt-8">
        <p className="max-w-[34ch] font-display text-2xl font-medium text-balance">
          Esta resposta já está escrita. No plano grátis ficam abertas as primeiras {ABERTAS_NO_GRATIS}.
        </p>
        <p className="mt-3 text-cinza-quente">
          {restantes === 1 ? "Falta 1 resposta" : `Faltam ${restantes} respostas`} para o mapa completo, com
          prática e Hora do Show.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            aria-disabled
            className="rounded-[3px] bg-fenix px-6 py-3 font-semibold text-noite shadow-fenix focus-visible:outline-osso"
          >
            Liberar com o kit avulso
          </button>
          <span className="text-sm text-cinza-quente">Pagamento em breve.</span>
        </div>
      </div>
    </article>
  );
}
