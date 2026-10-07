import Dexie, { type EntityTable } from "dexie";
import type { Kit, QaItem, Review } from "@/lib/domain";

// Espelho local do kit. A Hora do Show lê só daqui (zero rede durante a sessão);
// a Prática grava aqui e sincroniza com o Supabase quando a rede volta.
// Kits e qa_items: última escrita vence por updated_at (o banco ignora update
// mais antigo). Reviews: eventos só inseridos, com id gerado no aparelho.
class PhronixDB extends Dexie {
  kits!: EntityTable<Kit, "id">;
  qaItems!: EntityTable<QaItem, "id">;
  reviews!: EntityTable<Review, "id">;

  constructor() {
    super("phronix");
    this.version(1).stores({
      kits: "id, updated_at",
      qaItems: "id, kit_id, [kit_id+ordem], updated_at",
      reviews: "id, kit_id, qa_item_id, proxima_revisao",
    });
  }
}

export const localDb = new PhronixDB();
