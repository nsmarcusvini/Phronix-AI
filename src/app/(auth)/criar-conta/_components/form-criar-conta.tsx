"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BotaoEnviar, CampoSenha, CampoTexto, MINIMO_SENHA, Mensagem } from "../../_components/campos";

const DESTINO = "/comecar";

type Estado = { tipo: "parado" } | { tipo: "erro"; texto: string } | { tipo: "confirmar" };

// Criar conta por e-mail e senha. Com a sessão aberta, segue para o onboarding
// (só o currículo); com confirmação de e-mail ligada, o link leva para lá.
export function FormCriarConta() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < MINIMO_SENHA) {
      setEstado({ tipo: "erro", texto: `A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.` });
      return;
    }
    setEnviando(true);
    setEstado({ tipo: "parado" });
    const { data, error } = await createClient().auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome: nome.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${DESTINO}`,
      },
    });
    setEnviando(false);
    if (error) {
      setEstado({
        tipo: "erro",
        texto:
          error.code === "user_already_exists"
            ? "Já existe uma conta com esse e-mail. Entre com sua senha."
            : "Não deu para criar a conta agora. Tente de novo em instantes.",
      });
    } else if (!data.session) {
      setEstado({ tipo: "confirmar" });
    } else {
      router.replace(DESTINO);
      router.refresh();
    }
  }

  if (estado.tipo === "confirmar") {
    return (
      <Mensagem tipo="ok">
        Conta criada. Enviamos um link para <span className="font-medium">{email}</span>: confirme por ele e você
        cai direto no primeiro passo.
      </Mensagem>
    );
  }

  return (
    <>
      <form onSubmit={criar} className="space-y-5">
        <CampoTexto rotulo="Como quer ser chamado" valor={nome} onChange={setNome} autoComplete="given-name" autoFocus />
        <CampoTexto rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} autoComplete="email" />
        <CampoSenha valor={senha} onChange={setSenha} nova />

        {estado.tipo === "erro" && <Mensagem tipo="erro">{estado.texto}</Mensagem>}

        <div className="pt-2">
          <BotaoEnviar enviando={enviando}>Criar conta</BotaoEnviar>
        </div>
      </form>

      <p className="mt-14 border-t border-fio pt-6 text-sm text-cinza-quente">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-osso underline-offset-4 hover:underline">
          Entrar
        </Link>
        .
      </p>
    </>
  );
}
