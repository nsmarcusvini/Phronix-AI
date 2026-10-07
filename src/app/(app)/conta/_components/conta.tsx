"use client";

import { useState } from "react";
import { Campo } from "@/components/campo-inline";
import { localDb } from "@/lib/local-db";
import { Plano } from "./plano";

const MINIMO_SENHA = 8;

export function Conta() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-16">
      <h1 className="font-display text-display-lg font-medium">Conta e plano</h1>
      <div className="mt-12 divide-y divide-fio border-t border-fio">
        <Secao numero="01" titulo="Plano">
          <Plano />
        </Secao>
        <Secao numero="02" titulo="Conta">
          <DadosDaConta />
        </Secao>
        <Secao numero="03" titulo="Privacidade">
          <Privacidade />
        </Secao>
      </div>
    </main>
  );
}

function Secao({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  const id = `secao-${numero}`;
  return (
    <section aria-labelledby={id} className="grid gap-6 py-12 lg:grid-cols-[12rem_1fr] lg:gap-12">
      <h2 id={id} className="flex items-baseline gap-3 text-rotulo text-cinza-quente lg:sticky lg:top-6 lg:self-start">
        <span className="tabular-nums">{numero}</span>
        <span className="text-osso">{titulo}</span>
      </h2>
      <div className="min-w-0 max-w-3xl">{children}</div>
    </section>
  );
}

function DadosDaConta() {
  const [nome, setNome] = useState("Alex Souza");
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < MINIMO_SENHA) {
      setMensagem({ tipo: "erro", texto: `A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.` });
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const { error } = await createClient().auth.updateUser({ password: senha });
      if (error) setMensagem({ tipo: "erro", texto: "Entre na sua conta para trocar a senha." });
      else {
        setMensagem({ tipo: "ok", texto: "Senha alterada." });
        setTrocandoSenha(false);
        setSenha("");
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "O login ainda não está ligado neste ambiente." });
    }
  }

  return (
    <div>
      <p className="text-rotulo">
        <span className="text-ambar">Exemplo.</span>{" "}
        <span className="text-cinza-quente">Dados fictícios até o login estar ligado.</span>
      </p>
      <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-[8rem_1fr] sm:gap-y-6">
        <dt className="pt-1 text-rotulo text-cinza-quente">Nome</dt>
        <dd>
          <Campo rotulo="nome" valor={nome} onChange={setNome} linhaUnica className="text-lg" />
        </dd>
        <dt className="mt-4 pt-1 text-rotulo text-cinza-quente sm:mt-0">E-mail</dt>
        <dd className="py-1 text-lg">alex@exemplo.com</dd>
        <dt className="mt-4 pt-1 text-rotulo text-cinza-quente sm:mt-0">Senha</dt>
        <dd>
          {trocandoSenha ? (
            <form onSubmit={trocarSenha} className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Nova senha</span>
                <input
                  type="password"
                  autoFocus
                  autoComplete="new-password"
                  placeholder="Nova senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full max-w-xs rounded-[3px] border border-fio bg-grafite px-3 py-2 text-osso placeholder:text-cinza-quente focus:border-cinza-quente focus:outline-none"
                />
              </label>
              <button type="submit" className="rounded-[3px] border border-osso px-4 py-2 text-sm">
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrocandoSenha(false);
                  setMensagem(null);
                }}
                className="px-2 py-2 text-sm text-cinza-quente hover:text-osso"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setTrocandoSenha(true)}
              className="py-1 text-osso underline-offset-4 hover:underline"
            >
              Alterar senha
            </button>
          )}
          {mensagem && (
            <p role={mensagem.tipo === "erro" ? "alert" : "status"} className={`mt-2 text-sm ${mensagem.tipo === "erro" ? "text-ambar" : "text-osso"}`}>
              {mensagem.texto}
            </p>
          )}
        </dd>
      </dl>
    </div>
  );
}

type EstadoExclusao = "parado" | "confirmando" | "apagando" | "apagado";

function Privacidade() {
  const [exclusao, setExclusao] = useState<EstadoExclusao>("parado");

  async function apagar() {
    setExclusao("apagando");
    try {
      await Promise.all([localDb.kits.clear(), localDb.qaItems.clear(), localDb.reviews.clear()]);
    } catch {
      // Sem IndexedDB não há nada salvo no aparelho.
    }
    try {
      localStorage.removeItem("phronix:hora-do-show:preferencias");
    } catch {
      // Sem storage: nada a remover.
    }
    setExclusao("apagado");
  }

  return (
    <div className="space-y-10">
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[8rem_1fr] sm:gap-y-6">
        <dt className="pt-0.5 text-rotulo text-cinza-quente">Consentimento</dt>
        <dd>Você autorizou o uso do currículo ao enviá-lo.</dd>
        <dt className="mt-4 pt-0.5 text-rotulo text-cinza-quente sm:mt-0">Retenção</dt>
        <dd className="max-w-prose">
          O arquivo do currículo é apagado depois da leitura. Ficam só os dados que você revisou.
        </dd>
        <dt className="mt-4 pt-0.5 text-rotulo text-cinza-quente sm:mt-0">Documentos</dt>
        <dd className="text-cinza-quente">Termos de uso e Política de privacidade (em breve).</dd>
      </dl>

      <div className="border-t border-fio pt-8">
        {exclusao === "apagado" ? (
          <p role="status" className="max-w-prose">
            Pronto. Os dados deste aparelho foram apagados.{" "}
            <span className="text-cinza-quente">
              No exemplo, o kit de demonstração volta a ser criado na próxima vez que você abrir uma tela dele.
            </span>
          </p>
        ) : exclusao === "parado" ? (
          <button
            type="button"
            onClick={() => setExclusao("confirmando")}
            className="rounded-[3px] border border-fio px-5 py-3 text-osso transition-colors duration-150 hover:border-cinza-quente"
          >
            Excluir conta e todos os dados
          </button>
        ) : (
          <div role="alertdialog" aria-labelledby="titulo-exclusao" aria-describedby="texto-exclusao" className="animate-revelar border-l border-ambar pl-5">
            <p id="titulo-exclusao" className="font-display text-2xl font-medium">
              Apagar tudo, para sempre?
            </p>
            <p id="texto-exclusao" className="mt-3 max-w-prose text-cinza-quente">
              Some a sua conta, os currículos e vagas, todos os kits e respostas e o histórico de prática, aqui e no
              servidor. Não dá para desfazer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                autoFocus
                disabled={exclusao === "apagando"}
                onClick={apagar}
                className="rounded-[3px] bg-osso px-5 py-3 font-semibold text-noite disabled:opacity-60"
              >
                {exclusao === "apagando" ? "Apagando…" : "Apagar tudo"}
              </button>
              <button
                type="button"
                onClick={() => setExclusao("parado")}
                className="rounded-[3px] px-4 py-3 text-cinza-quente hover:text-osso"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
