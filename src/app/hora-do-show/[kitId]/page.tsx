import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Hora do Show" };

export default async function HoraDoShow({ params }: PageProps<"/hora-do-show/[kitId]">) {
  const { kitId } = await params;
  return (
    <TelaPendente
      titulo="Hora do Show"
      descricao={`Kit ${kitId}. Lê só do IndexedDB: sidebar, busca fuzzy e atalhos, sem rede.`}
    />
  );
}
