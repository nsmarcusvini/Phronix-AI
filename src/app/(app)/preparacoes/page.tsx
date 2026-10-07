import { CabecalhoApp } from "@/components/cabecalho-app";
import { Preparacoes } from "./_components/preparacoes";

export const metadata = { title: "Minhas preparações" };

export default async function Page({ searchParams }: PageProps<"/preparacoes">) {
  const { vazio } = await searchParams;
  return (
    <>
      <CabecalhoApp />
      <Preparacoes vazio={vazio === "1"} />
    </>
  );
}
