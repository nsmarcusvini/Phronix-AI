"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BotaoEnviar, CampoTexto, Mensagem, Pagina } from "../../_components/campos";

// Pede o link de redefinição. A resposta é a mesma exista ou não a conta,
// para não revelar quais e-mails estão cadastrados.
export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/entrar/nova-senha`,
    });
    setEnviando(false);
    setEnviado(true);
  }

  return (
    <Pagina rotulo="Esqueci minha senha" titulo="Vamos criar uma senha nova.">
      {enviado ? (
        <div className="space-y-6">
          <Mensagem tipo="ok">
            Se houver uma conta com {email}, o link chega em instantes. Confira também o spam.
          </Mensagem>
          <Link href="/entrar" className="inline-block text-sm text-osso underline-offset-4 hover:underline">
            Voltar para entrar
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          <p className="text-cinza-quente">Mandamos um link para o seu e-mail.</p>
          <CampoTexto rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} autoComplete="email" autoFocus />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <BotaoEnviar enviando={enviando}>Enviar link</BotaoEnviar>
            <Link href="/entrar" className="text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline">
              Lembrei a senha
            </Link>
          </div>
        </form>
      )}
    </Pagina>
  );
}
