import { TelaPendente } from "@/components/tela-pendente";

export const metadata = { title: "Conta e plano" };

export default function Conta() {
  return (
    <TelaPendente
      titulo="Conta e plano"
      descricao="Plano atual, pagamento, exportação e exclusão de conta em 1 clique (LGPD)."
    />
  );
}
