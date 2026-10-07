import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Prática" };

export default async function Pratica({ params }: PageProps<"/kits/[kitId]/pratica">) {
  const { kitId } = await params;
  return (
    <TelaPendente
      titulo="Prática"
      descricao={`Kit ${kitId}. Sessões de 5 minutos: flashcard, âncoras, lacunas e pergunta-relâmpago.`}
    />
  );
}
