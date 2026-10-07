import Dexie, { type EntityTable } from "dexie";
import type { Kit, QaItem, Review } from "@/lib/domain";

// Espelho local do kit. A Hora do Show lê só daqui (zero rede durante a sessão);
// a Prática e o Mapa gravam aqui e a fila leva as mudanças ao Supabase quando
// há rede (src/lib/sync/sincronizar.ts).
// Kits e qa_items: última escrita vence por updated_at (o banco ignora update
// mais antigo). Reviews: eventos só inseridos, com id gerado no aparelho.

// Uma mudança local esperando envio. Guarda só a referência: no envio, vale o
// estado mais recente da linha.
export type OperacaoFila = {
  seq?: number;
  kit_id: string;
  tipo: "review" | "resposta";
  id: string;
  criado_em: string;
};

class PhronixDB extends Dexie {
  kits!: EntityTable<Kit, "id">;
  qaItems!: EntityTable<QaItem, "id">;
  reviews!: EntityTable<Review, "id">;
  fila!: EntityTable<OperacaoFila, "seq">;

  constructor() {
    super("phronix");
    this.version(1).stores({
      kits: "id, updated_at",
      qaItems: "id, kit_id, [kit_id+ordem], updated_at",
      reviews: "id, kit_id, qa_item_id, proxima_revisao",
    });
    this.version(2).stores({
      fila: "++seq, kit_id, [tipo+id]",
    });
  }
}

export const localDb = new PhronixDB();
