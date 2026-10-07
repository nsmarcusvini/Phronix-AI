"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Campo } from "@/components/campo-inline";
import { localDb } from "@/lib/local-db";
import type { PlanoId } from "@/lib/planos";
import { createClient } from "@/lib/supabase/client";
import { Plano } from "./plano";

const MINIMO_SENHA = 8;

export type DadosConta = {
  id: string;
  email: string;
  nome: string;
  plano: PlanoId;
  consentimentoEm: string | null;
  avulsoAte: string | null;
};

export function Conta({ dados }: { dados: DadosConta }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-16">
      <h1 className="font-display text-display-lg font-medium">Conta e plano</h1>
      <div className="mt-12 divide-y divide-fio border-t border-fio">
        <Secao numero="01" titulo="Plano">
          <Plano plano={dados.plano} avulsoAte={dados.avulsoAte} />
        </Secao>
        <Secao numero="02" titulo="Conta">
          <DadosDaConta dados={dados} />
        </Secao>
        <Secao numero="03" titulo="Privacidade">
          <Privacidade consentimentoEm={dados.consentimentoEm} />
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

function DadosDaConta({ dados }: { dados: DadosConta }) {
  const router = useRouter();
  const [nome, setNome] = useState(dados.nome);
  const [estadoNome, setEstadoNome] = useState<"parado" | "salvando" | "salvo" | "erro">("parado");
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  // Salva o nome pouco depois de parar de digitar.
  function mudarNome(valor: string) {
    setNome(valor);
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(async () => {
      setEstadoNome("salvando");
      const { error } = await createClient()
        .from("profiles")
        .update({ nome: valor.trim() || null })
        .eq("id", dados.id);
      setEstadoNome(error ? "erro" : "salvo");
    }, 700);
  }

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < MINIMO_SENHA) {
      setMensagem({ tipo: "erro", texto: `A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.` });
      return;
    }
    const { error } = await createClient().auth.updateUser({ password: senha });
    if (error?.code === "same_password") {
      setMensagem({ tipo: "erro", texto: "Escolha uma senha diferente da atual." });
    } else if (error) {
      setMensagem({ tipo: "erro", texto: "Não deu para trocar a senha agora. Tente de novo em instantes." });
    } else {
      setMensagem({ tipo: "ok", texto: "Senha alterada." });
      setTrocandoSenha(false);
      setSenha("");
    }
  }

  async function sair() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div>
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[8rem_1fr] sm:gap-y-6">
        <dt className="pt-1 text-rotulo text-cinza-quente">Nome</dt>
        <dd>
          <Campo rotulo="nome" valor={nome} onChange={mudarNome} placeholder="Como quer ser chamado" linhaUnica className="text-lg" />
          <p role="status" className="min-h-[1.2em] text-rotulo text-cinza-quente">
            {estadoNome === "salvando" && "Salvando…"}
            {estadoNome === "salvo" && "Salvo."}
            {estadoNome === "erro" && <span className="text-ambar">Não deu para salvar o nome.</span>}
          </p>
        </dd>
        <dt className="mt-4 pt-1 text-rotulo text-cinza-quente sm:mt-0">E-mail</dt>
        <dd className="py-1 text-lg">{dados.email}</dd>
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
            <p
              role={mensagem.tipo === "erro" ? "alert" : "status"}
              className={`mt-2 text-sm ${mensagem.tipo === "erro" ? "text-ambar" : "text-osso"}`}
            >
              {mensagem.texto}
            </p>
          )}
        </dd>
      </dl>
      <button
        type="button"
        onClick={sair}
        className="mt-10 rounded-[3px] border border-fio px-5 py-2.5 text-osso transition-colors duration-150 hover:border-cinza-quente"
      >
        Sair
      </button>
    </div>
  );
}

type EstadoExclusao = "parado" | "confirmando" | "apagando" | "erro";

async function limparAparelho() {
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
}

function Privacidade({ consentimentoEm }: { consentimentoEm: string | null }) {
  const router = useRouter();
  const [exclusao, setExclusao] = useState<EstadoExclusao>("parado");
  const [erro, setErro] = useState("");

  async function apagar() {
    setExclusao("apagando");
    const resposta = await fetch("/api/conta/excluir", { method: "POST" }).catch(() => null);
    if (!resposta?.ok) {
      const corpo = await resposta?.json().catch(() => null);
      setErro(corpo?.erro ?? "Não deu para excluir agora. Tente de novo em instantes.");
      setExclusao("erro");
      return;
    }
    await limparAparelho();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-[8rem_1fr] sm:gap-y-6">
        <dt className="pt-0.5 text-rotulo text-cinza-quente">Consentimento</dt>
        <dd>
          {consentimentoEm
            ? `Você autorizou o uso do currículo em ${new Date(consentimentoEm).toLocaleDateString("pt-BR")}.`
            : "Você ainda não enviou um currículo."}
        </dd>
        <dt className="mt-4 pt-0.5 text-rotulo text-cinza-quente sm:mt-0">Retenção</dt>
        <dd className="max-w-prose">
          O arquivo do currículo é apagado depois da leitura. Ficam só os dados que você revisou.
        </dd>
        <dt className="mt-4 pt-0.5 text-rotulo text-cinza-quente sm:mt-0">Documentos</dt>
        <dd className="text-cinza-quente">Termos de uso e Política de privacidade (em breve).</dd>
      </dl>

      <div className="border-t border-fio pt-8">
        {exclusao === "parado" ? (
          <button
            type="button"
            onClick={() => setExclusao("confirmando")}
            className="rounded-[3px] border border-fio px-5 py-3 text-osso transition-colors duration-150 hover:border-cinza-quente"
          >
            Excluir conta e todos os dados
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-labelledby="titulo-exclusao"
            aria-describedby="texto-exclusao"
            className="animate-revelar border-l border-ambar pl-5"
          >
            <p id="titulo-exclusao" className="font-display text-2xl font-medium">
              Apagar tudo, para sempre?
            </p>
            <p id="texto-exclusao" className="mt-3 max-w-prose text-cinza-quente">
              Some a sua conta, os currículos e vagas, todos os kits e respostas e o histórico de prática, aqui e no
              servidor. Não dá para desfazer.
            </p>
            {exclusao === "erro" && (
              <p role="alert" className="mt-3 text-sm text-ambar">
                {erro}
              </p>
            )}
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
