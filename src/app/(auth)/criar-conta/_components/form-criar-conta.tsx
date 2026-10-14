"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BotaoEnviar, CampoSenha, CampoTexto, MINIMO_SENHA, Mensagem } from "../../_components/campos";

const DESTINO = "/painel";

type Estado = { tipo: "parado" } | { tipo: "erro"; texto: string };

// Criar conta por e-mail e senha, e só isso: o currículo é lido depois, dentro
// do app. Criada a conta, a pessoa vai para a tela de entrar com o e-mail já
// preenchido. Com confirmação de e-mail ligada no Supabase, o aviso pede para
// confirmar antes; o link do e-mail também leva ao painel.
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
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome: nome.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${DESTINO}`,
      },
    });
    // Com confirmação ligada, e-mail repetido não dá erro: volta um usuário
    // sem identidades.
    const jaExiste = error?.code === "user_already_exists" || data.user?.identities?.length === 0;
    if (error || jaExiste || !data.user) {
      setEnviando(false);
      setEstado({
        tipo: "erro",
        texto: jaExiste
          ? "Já existe uma conta com esse e-mail. Entre com sua senha."
          : error?.code === "weak_password"
            ? "Essa senha é fraca demais. Use letras e números, com pelo menos 8 caracteres."
            : "Não deu para criar a conta agora. Tente de novo em instantes.",
      });
      return;
    }

    // A tela de entrar é o próximo passo: se o Supabase já abriu a sessão,
    // ela é fechada para a pessoa entrar com a senha que acabou de criar.
    if (data.session) await supabase.auth.signOut();
    const aviso = data.session ? "criada" : "confirmar";
    router.replace(`/entrar?conta=${aviso}&email=${encodeURIComponent(email)}`);
  }

  return (
    <>
      <form onSubmit={criar} className="space-y-5">
        <CampoTexto
          rotulo="Como quer ser chamado"
          valor={nome}
          onChange={setNome}
          autoComplete="given-name"
          autoFocus
        />
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
