"use client";

import { useState } from "react";
import { BotaoPrimario } from "./comum";

type Modo = "criar" | "entrar";

const MINIMO_SENHA = 8;

// Login por e-mail e senha, pedido só aqui: para ver o diagnóstico.
// Chama o Supabase de verdade quando as variáveis estão configuradas.
export function PortaoLogin({ onEntrou, onSemConta }: { onEntrou: () => void; onSemConta: () => void }) {
  const [modo, setModo] = useState<Modo>("criar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    if (senha.length < MINIMO_SENHA) {
      setErro(`A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.`);
      return;
    }
    setEnviando(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } =
        modo === "criar"
          ? await supabase.auth.signUp({ email, password: senha })
          : await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        setErro(
          modo === "entrar" ? "E-mail ou senha não conferem." : "Não deu para criar a conta. Tente outro e-mail.",
        );
      } else if (modo === "criar" && !data.session) {
        setAviso("Conta criada. Confirme pelo link que enviamos para o seu e-mail e depois entre.");
        setModo("entrar");
      } else {
        onEntrou();
      }
    } catch {
      setErro("O login ainda não está ligado neste ambiente. Use “Continuar sem conta” para ver o exemplo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[3px] border border-fio bg-noite/95 p-6 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.8)] backdrop-blur sm:p-8">
      <h2 className="font-display text-2xl font-medium text-balance">
        Seu diagnóstico está pronto. Crie uma conta para ver.
      </h2>
      <p className="mt-2 text-sm text-cinza-quente">Assim a preparação fica salva e você pratica de qualquer aparelho.</p>

      <div role="tablist" aria-label="Criar conta ou entrar" className="mt-6 flex gap-1 border-b border-fio text-sm">
        {(["criar", "entrar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              setErro(null);
            }}
            className={`relative px-3 pb-2.5 ${modo === m ? "text-osso" : "text-cinza-quente hover:text-osso"}`}
          >
            {m === "criar" ? "Criar conta" : "Já tenho conta"}
            {modo === m && <span aria-hidden className="absolute inset-x-3 -bottom-px h-px bg-fenix" />}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-rotulo text-cinza-quente">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block w-full rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso focus:border-cinza-quente focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between text-rotulo text-cinza-quente">
            Senha
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              className="text-cinza-quente hover:text-osso"
            >
              {verSenha ? "Esconder" : "Mostrar"}
            </button>
          </span>
          <input
            type={verSenha ? "text" : "password"}
            required
            minLength={MINIMO_SENHA}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby="regra-senha"
            className="mt-2 block w-full rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso focus:border-cinza-quente focus:outline-none"
          />
          {modo === "criar" && (
            <span id="regra-senha" className="mt-1.5 block text-rotulo text-cinza-quente">
              Pelo menos {MINIMO_SENHA} caracteres.
            </span>
          )}
        </label>

        {erro && (
          <p role="alert" className="text-sm text-ambar">
            {erro}
          </p>
        )}
        {aviso && (
          <p role="status" className="text-sm text-osso">
            {aviso}
          </p>
        )}

        <BotaoPrimario type="submit" disabled={enviando}>
          {enviando ? "Um instante" : modo === "criar" ? "Criar conta e ver" : "Entrar e ver"}
        </BotaoPrimario>
      </form>

      <button
        type="button"
        onClick={onSemConta}
        className="mt-6 text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
      >
        Continuar sem conta (demonstração)
      </button>
    </div>
  );
}
