import type { TipoEntrevista } from "@/lib/domain";
import { Conversa } from "./_components/conversa";

export const metadata = { title: "Conversa" };

const TIPOS: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];

export default async function Page({ searchParams }: PageProps<"/kits/[kitId]/conversa">) {
  const { tipo } = await searchParams;
  const escolhido = TIPOS.find((t) => t === tipo) ?? "tecnica";
  return <Conversa tipo={escolhido} />;
}
