import type { TipoEntrevista } from "@/lib/domain";

// Preparações fictícias para mostrar o agrupamento e os estados da lista.
// Rotuladas como exemplo na tela e sem link: não abrem nada.

export type KitFicticio = {
  id: string;
  tipo: TipoEntrevista;
  status: "rascunho" | "diagnosticado" | "garimpo";
  // Conversa em andamento: requisitos cobertos de quantos.
  cobertura?: { cobertos: number; total: number };
};

export type VagaFicticia = {
  id: string;
  empresa: string;
  cargo: string;
  diasAteEntrevista: number | null;
  kits: KitFicticio[];
};

// Kit de RH na mesma vaga do kit de demonstração.
export const kitRhDaVagaDemo: KitFicticio = {
  id: "exemplo-rh",
  tipo: "rh",
  status: "garimpo",
  cobertura: { cobertos: 3, total: 5 },
};

export const outraVaga: VagaFicticia = {
  id: "exemplo-vaga-2",
  empresa: "Fintech Exemplo",
  cargo: "Engenharia de Software Sênior",
  diasAteEntrevista: 9,
  kits: [{ id: "exemplo-tecnica-2", tipo: "tecnica", status: "rascunho" }],
};
