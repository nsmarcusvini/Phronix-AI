"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PassoCurriculo } from "@/components/preparacao/passo-curriculo";
import { salvarCurriculo } from "@/lib/preparacao/salvar";
import { createClient } from "@/lib/supabase/client";

// Primeiro passo depois de criar a conta: ler e revisar o currículo. Salvo,
// a pessoa entra no painel, onde cadastra as vagas.
export function Onboarding({ atualizando }: { atualizando: boolean }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <>
      <header className="border-b border-fio">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
          {/* Logo pendente: wordmark provisório. */}
          <span className="font-display text-lg font-semibold tracking-tight">Phronix</span>
          <span className="text-rotulo text-cinza-quente">{atualizando ? "Atualizar currículo" : "Primeiro passo"}</span>
          {atualizando && (
            <Link href="/painel" className="ml-auto text-sm text-cinza-quente hover:text-osso">
              Voltar ao painel
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <div className="max-w-3xl">
          <PassoCurriculo
            salvando={salvando}
            erroSalvar={erro}
            onConfirmado={async (dados, entrada) => {
              setSalvando(true);
              setErro(null);
              try {
                await salvarCurriculo(createClient(), entrada, dados);
                router.replace("/painel");
                router.refresh();
              } catch {
                setErro("Não deu para salvar agora. Tente de novo.");
                setSalvando(false);
              }
            }}
          />
        </div>
      </main>
    </>
  );
}
