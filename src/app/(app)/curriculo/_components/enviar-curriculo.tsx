"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PassoCurriculo } from "@/components/preparacao/passo-curriculo";
import { salvarCurriculo } from "@/lib/preparacao/salvar";
import { createClient } from "@/lib/supabase/client";

// O currículo é lido aqui, dentro do app, só com a conta criada. Trocar não
// mexe nas entrevistas já elaboradas: elas guardam o currículo da época.
export function EnviarCurriculo({
  destino,
  atual,
}: {
  destino: string;
  atual: { nome: string; criadoEm: string } | null;
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
      <div className="max-w-3xl">
        {atual && (
          <p className="mb-8 border-l border-fio pl-4 text-sm text-cinza-quente">
            Seu currículo atual foi salvo em {new Date(atual.criadoEm).toLocaleDateString("pt-BR")}. O novo vale para as
            próximas entrevistas; as que você já elaborou continuam como estão.
          </p>
        )}
        <PassoCurriculo
          titulo={atual ? "Trocar o currículo." : "Comece pelo seu currículo."}
          salvando={salvando}
          erroSalvar={erro}
          onConfirmado={async (dados, entrada) => {
            setSalvando(true);
            setErro(null);
            try {
              await salvarCurriculo(createClient(), entrada, dados);
              router.replace(destino);
              router.refresh();
            } catch {
              setErro("Não deu para salvar agora. Tente de novo.");
              setSalvando(false);
            }
          }}
        />
      </div>
    </main>
  );
}
