import { CabecalhoApp } from "@/components/cabecalho-app";
import { Conta } from "./_components/conta";

export const metadata = { title: "Conta e plano" };

export default function Page() {
  return (
    <>
      <CabecalhoApp />
      <Conta />
    </>
  );
}
