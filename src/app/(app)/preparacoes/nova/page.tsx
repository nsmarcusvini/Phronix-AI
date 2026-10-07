import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Nova preparação" };

export default function NovaPreparacao() {
  return (
    <TelaPendente
      titulo="Nova preparação"
      descricao="Wizard de 4 passos: currículo, vaga, diagnóstico e tipo de entrevista."
    />
  );
}
