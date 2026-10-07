import { destinoSeguro } from "@/lib/destino";
import { Pagina } from "../_components/campos";
import { FormEntrar } from "./_components/form-entrar";

export const metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { next, erro } = await searchParams;
  return (
    <Pagina rotulo="Entrar" titulo="Bom te ver de volta.">
      <FormEntrar destino={destinoSeguro(typeof next === "string" ? next : undefined)} linkExpirado={erro === "link"} />
    </Pagina>
  );
}
