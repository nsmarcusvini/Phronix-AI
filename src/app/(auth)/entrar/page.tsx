import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Entrar" };

export default function Entrar() {
  return (
    <TelaPendente
      titulo="Cadastro"
      descricao="Magic link por e-mail. Pedido só na hora de ver o diagnóstico."
    />
  );
}
