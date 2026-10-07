"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BotaoEnviar, CampoSenha, CampoTexto, Mensagem } from "../../_components/campos";

type Estado =
  | { tipo: "parado" }
  | { tipo: "erro"; texto: string }
  | { tipo: "nao-confirmado" }
  | { tipo: "reenviado" };

export function FormEntrar({ destino, linkExpirado }: { destino: string; linkExpirado: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setEstado({ tipo: "parado" });
    const { error } = await createClient().auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (!error) {
      router.replace(destino);
      router.refresh();
    } else if (error.code === "email_not_confirmed") {
      setEstado({ tipo: "nao-confirmado" });
    } else if (error.code === "invalid_credentials") {
      setEstado({ tipo: "erro", texto: "E-mail ou senha não conferem." });
    } else {
      setEstado({ tipo: "erro", texto: "Não deu para entrar agora. Tente de novo em instantes." });
    }
  }

  async function reenviar() {
    await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}` },
    });
    setEstado({ tipo: "reenviado" });
  }

  return (
    <>
      {linkExpirado && (
        <div className="mb-8">
          <Mensagem tipo="erro">O link expirou ou já foi usado. Entre com sua senha ou peça um novo.</Mensagem>
        </div>
      )}

      <form onSubmit={entrar} className="space-y-5">
        <CampoTexto rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} autoComplete="email" autoFocus />
        <CampoSenha valor={senha} onChange={setSenha} />

        {estado.tipo === "erro" && <Mensagem tipo="erro">{estado.texto}</Mensagem>}
        {estado.tipo === "nao-confirmado" && (
          <Mensagem tipo="erro">
            Falta confirmar o e-mail pelo link que enviamos.{" "}
            <button type="button" onClick={reenviar} className="text-osso underline underline-offset-4">
              Reenviar link
            </button>
          </Mensagem>
        )}
        {estado.tipo === "reenviado" && <Mensagem tipo="ok">Link reenviado. Confira a caixa de entrada e o spam.</Mensagem>}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          <BotaoEnviar enviando={enviando}>Entrar</BotaoEnviar>
          <Link href="/entrar/recuperar" className="text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </form>

      <p className="mt-14 border-t border-fio pt-6 text-sm text-cinza-quente">
        Ainda não tem conta?{" "}
        <Link href="/preparacoes/nova" className="text-osso underline-offset-4 hover:underline">
          Comece uma preparação
        </Link>
        . A conta é criada quando você vê o diagnóstico.
      </p>
    </>
  );
}
