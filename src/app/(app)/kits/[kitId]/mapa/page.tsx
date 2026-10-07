import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Mapa" };

export default async function Mapa({ params }: PageProps<"/kits/[kitId]/mapa">) {
  const { kitId } = await params;
  return (
    <TelaPendente
      titulo="Mapa"
      descricao={`Kit ${kitId}. Perguntas e respostas curtas por categoria, com editor inline e ações rápidas.`}
    />
  );
}
