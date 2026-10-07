"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BotaoEnviar, CampoSenha, MINIMO_SENHA, Mensagem, Pagina } from "../../_components/campos";

// Chega aqui pelo link de redefinição (via /auth/callback, que abre a sessão).
export default function NovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [semSessao, setSemSessao] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < MINIMO_SENHA) return setErro(`A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.`);
    if (senha !== confirmacao) return setErro("As duas senhas não estão iguais.");
    setEnviando(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setEnviando(false);
    if (!error) {
      router.replace("/preparacoes");
      router.refresh();
    } else if (error.code === "same_password") {
      setErro("Escolha uma senha diferente da anterior.");
    } else if (error.name === "AuthSessionMissingError" || error.code === "session_not_found") {
      setSemSessao(true);
    } else {
      setErro("Não deu para salvar agora. Tente de novo em instantes.");
    }
  }

  if (semSessao) {
    return (
      <Pagina rotulo="Nova senha" titulo="Esse link expirou.">
        <div className="space-y-6">
          <p className="text-cinza-quente">Links de redefinição valem por pouco tempo e só uma vez.</p>
          <Link href="/entrar/recuperar" className="inline-block text-osso underline-offset-4 hover:underline">
            Pedir outro link
          </Link>
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina rotulo="Nova senha" titulo="Escolha a senha nova.">
      <form onSubmit={salvar} className="space-y-5">
        <CampoSenha rotulo="Senha nova" valor={senha} onChange={setSenha} nova autoFocus />
        <CampoSenha rotulo="Repita a senha" valor={confirmacao} onChange={setConfirmacao} />
        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        <div className="pt-2">
          <BotaoEnviar enviando={enviando}>Salvar e entrar</BotaoEnviar>
        </div>
      </form>
    </Pagina>
  );
}
