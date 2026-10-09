"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Kit, TipoEntrevista } from "@/lib/domain";
import { DEMO_KIT_ID } from "@/lib/hora-do-show/demo";
import { localDb } from "@/lib/local-db";
import { dataCurta, dataLocal } from "@/lib/pratica/formatos";
import { baixarKit } from "@/lib/sync/sincronizar";
import { createClient } from "@/lib/supabase/client";

const NOME: Record<TipoEntrevista, string> = {
  rh: "Entrevista de RH",
  tecnica: "Entrevista técnica",
  lideranca: "Entrevista de liderança",
};
const DIA = 86_400_000;
const CHAVE_VAGAS = "phronix:hora-do-show:vagas";
const LIMITE_MS = 5000;

type Vagas = Record<string, { cargo: string | null; empresa: string | null }>;
type Item = { kit: Kit; respostas: number; vaga?: Vagas[string] };

// Nome da vaga de cada kit, guardado no aparelho para a lista funcionar sem
// rede (o kit salvo no IndexedDB não traz cargo nem empresa).
function lerVagas(): Vagas {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_VAGAS) ?? "{}");
  } catch {
    return {};
  }
}
function guardarVagas(vagas: Vagas) {
  try {
    localStorage.setItem(CHAVE_VAGAS, JSON.stringify(vagas));
  } catch {}
}

async function lerDoAparelho(): Promise<Item[]> {
  const vagas = lerVagas();
  const kits = (await localDb.kits.toArray()).filter((k) => k.id !== DEMO_KIT_ID);
  const itens = await Promise.all(
    kits.map(async (kit) => ({
      kit,
      respostas: await localDb.qaItems.where("kit_id").equals(kit.id).count(),
      vaga: vagas[kit.id],
    })),
  );
  return itens.filter((i) => i.respostas > 0);
}

// Com rede: traz as entrevistas com mapa da conta e salva cada uma no
// aparelho, para a Hora do Show abrir mesmo se a internet cair depois.
async function atualizarDoServidor() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase
    .from("kits")
    .select("id, vaga:jobs!kits_job_id_user_id_fkey ( cargo, empresa )")
    .eq("status", "pronto");
  if (!data) return;
  const vagas = lerVagas();
  for (const k of data) {
    const vaga = Array.isArray(k.vaga) ? k.vaga[0] : k.vaga;
    if (vaga) vagas[k.id] = { cargo: vaga.cargo, empresa: vaga.empresa };
  }
  guardarVagas(vagas);
  await Promise.all(data.map((k) => baixarKit(k.id).catch(() => false)));
}

function ordem(kit: Kit, hoje: number) {
  if (!kit.data_entrevista) return 10_000;
  const dias = Math.round((dataLocal(kit.data_entrevista).getTime() - hoje) / DIA);
  return dias < 0 ? 20_000 - dias : dias;
}

function quando(kit: Kit, hoje: Date) {
  if (!kit.data_entrevista) return "Sem data marcada";
  const data = dataLocal(kit.data_entrevista);
  const dias = Math.round((data.getTime() - hoje.getTime()) / DIA);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias < 0) return `Foi em ${dataCurta(data, hoje)}`;
  return `${dataCurta(data, hoje)}, em ${dias} dias`;
}

// Escolher a entrevista antes de entrar no palco. Lê primeiro o que já está
// no aparelho (abre sem rede) e, se houver internet, atualiza a lista.
export function EscolherEntrevista() {
  const [itens, setItens] = useState<Item[] | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      // O aparelho responde em milissegundos; se o IndexedDB travar, a tela
      // abre mesmo assim com a lista vazia em vez de ficar carregando.
      const locais = await Promise.race([
        lerDoAparelho().catch((): Item[] => []),
        new Promise<Item[]>((ok) => setTimeout(() => ok([]), 1500)),
      ]);
      if (!vivo) return;
      setItens(locais);
      setOnline(navigator.onLine);
      if (!navigator.onLine) return;
      await Promise.race([atualizarDoServidor().catch(() => {}), new Promise((ok) => setTimeout(ok, LIMITE_MS))]);
      const atualizados = await lerDoAparelho().catch(() => locais);
      if (vivo) setItens(atualizados);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (itens === null)
    return (
      <p className="sr-only" role="status">
        Carregando as entrevistas
      </p>
    );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const lista = [...itens].sort((a, b) => ordem(a.kit, hoje.getTime()) - ordem(b.kit, hoje.getTime()));

  return (
    <main className="mx-auto w-full max-w-[40rem] flex-1 px-6 pt-8 pb-12">
      <header className="flex items-baseline justify-between gap-4">
        <p className="text-hs-pergunta text-cinza-quente">Hora do Show</p>
        <Link href="/painel" className="text-hs-sidebar text-cinza-quente hover:text-osso">
          Painel
        </Link>
      </header>
      <h1 className="mt-6 text-hs-gancho font-bold">Qual entrevista é agora?</h1>
      <p className="mt-2 text-hs-bullet text-cinza-quente">
        As respostas ficam salvas no aparelho e abrem mesmo sem internet.
      </p>
      {!online && (
        <p className="mt-4 text-hs-sidebar text-ambar">
          Sem internet: mostrando as entrevistas já salvas neste aparelho.
        </p>
      )}

      {lista.length === 0 ? (
        <div className="mt-10 border-t border-fio pt-6">
          <p className="text-hs-bullet">Nenhuma entrevista com mapa neste aparelho.</p>
          <p className="mt-2 text-hs-sidebar text-cinza-quente">
            Elabore uma entrevista e termine a conversa dos casos. Depois, abra esta tela uma vez com internet.
          </p>
        </div>
      ) : (
        <ul className="mt-8 border-t border-fio">
          {lista.map(({ kit, respostas, vaga }, i) => {
            const proxima = i === 0 && ordem(kit, hoje.getTime()) < 10_000;
            return (
              <li key={kit.id} className="border-b border-fio">
                <Link
                  href={`/hora-do-show/${kit.id}`}
                  className="relative block py-5 pl-4 outline-none focus-visible:bg-grafite"
                >
                  {proxima && <span aria-hidden className="absolute inset-y-5 left-0 w-1 bg-fenix" />}
                  <span className="block text-hs-bullet font-bold">{NOME[kit.tipo]}</span>
                  <span className="mt-1 block text-hs-sidebar text-cinza-quente">
                    {vaga
                      ? [vaga.cargo ?? "Vaga sem cargo", vaga.empresa].filter(Boolean).join(", ")
                      : "Vaga salva no aparelho"}
                  </span>
                  <span className={`mt-1 block text-hs-sidebar ${proxima ? "text-osso" : "text-cinza-quente"}`}>
                    {quando(kit, hoje)}. {respostas} respostas.
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/hora-do-show/demo"
        className="mt-10 inline-block text-hs-sidebar text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
      >
        Abrir o kit de demonstração
      </Link>
    </main>
  );
}
