import { destinoSeguro } from "@/lib/destino";
import { Pagina } from "../_components/campos";
import { FormEntrar } from "./_components/form-entrar";

export const metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { next, erro, conta, email } = await searchParams;
  // Vindo de /criar-conta: conta=criada (já pode entrar) ou conta=confirmar
  // (falta clicar no link do e-mail).
  const contaNova = conta === "criada" || conta === "confirmar" ? conta : null;
  return (
    <Pagina rotulo="Entrar" titulo={contaNova ? "Conta criada. Agora é só entrar." : "Bom te ver de volta."}>
      <FormEntrar
        destino={destinoSeguro(typeof next === "string" ? next : undefined)}
        linkExpirado={erro === "link"}
        contaNova={contaNova}
        emailInicial={typeof email === "string" ? email.slice(0, 254) : ""}
      />
    </Pagina>
  );
}
