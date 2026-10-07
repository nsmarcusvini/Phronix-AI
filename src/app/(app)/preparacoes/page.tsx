import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Minhas preparações" };

export default function Preparacoes() {
  return (
    <TelaPendente
      titulo="Minhas preparações"
      descricao="Lista de kits por vaga e tipo de entrevista, com o progresso da Prática."
    />
  );
}
