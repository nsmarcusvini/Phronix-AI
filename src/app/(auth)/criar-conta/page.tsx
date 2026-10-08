import { Pagina } from "../_components/campos";
import { FormCriarConta } from "./_components/form-criar-conta";

export const metadata = { title: "Criar conta" };

export default function CriarConta() {
  return (
    <Pagina rotulo="Criar conta" titulo="Sua próxima entrevista começa aqui.">
      <FormCriarConta />
    </Pagina>
  );
}
