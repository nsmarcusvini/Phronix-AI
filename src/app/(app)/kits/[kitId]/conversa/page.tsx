import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Conversa" };

export default async function Conversa({ params }: PageProps<"/kits/[kitId]/conversa">) {
  const { kitId } = await params;
  return (
    <TelaPendente
      titulo="Conversa"
      descricao={`Kit ${kitId}. Garimpo de cases: uma pergunta por vez, chips de resposta rápida e barra de cobertura dos requisitos.`}
    />
  );
}
