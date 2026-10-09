import Link from "next/link";
import { redirect } from "next/navigation";
import { CabecalhoApp } from "@/components/cabecalho-app";
import { Anel } from "@/components/painel/anel";
import type { TipoEntrevista } from "@/lib/domain";
import { NOME_TIPO } from "@/lib/hora-do-show/categorias";
import { entrevistaEm } from "@/lib/pratica/formatos";
import { metricasDePratica } from "@/lib/pratica/metricas";
import { listarPreparacoes } from "@/lib/preparacao/listar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Praticar" };

const ORDEM: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];

// Escolher o que praticar: as entrevistas com mapa, primeiro as que têm
// respostas esperando revisão, cada uma com o resultado da última rodada.
export default async function Pratica() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/pratica");

  const [vagas, metricas] = await Promise.all([listarPreparacoes(supabase), metricasDePratica(supabase)]);
  const entrevistas = vagas
    .flatMap((vaga) => ORDEM.flatMap((tipo) => (vaga.kits[tipo] ? [{ kit: vaga.kits[tipo], tipo, vaga }] : [])))
    .filter((e) => e.kit.total > 0 && (e.vaga.dias === null || e.vaga.dias >= 0))
    .sort((a, b) => b.kit.aRevisar - a.kit.aRevisar);
  const ultimaPorKit = new Map(metricas.recentes.map((s) => [s.kitId, s]));
  const semMapa = vagas.some((v) => Object.values(v.kits).some((k) => k.total === 0));

  return (
    <>
      <CabecalhoApp />
      <main className="mx-auto w-full max-w-4xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <h1 className="font-display text-display-lg font-medium">O que você quer praticar?</h1>
        <p className="mt-3 max-w-prose text-cinza-quente">
          Rodadas curtas com as respostas de cada entrevista. Acertou, a resposta avança até o Palco; errou, ela volta.
        </p>

        {entrevistas.length === 0 ? (
          <div className="mt-12 border-y border-fio py-8">
            <p className="max-w-prose">
              {semMapa
                ? "Sua entrevista ainda não tem mapa. Termine a conversa dos casos para liberar a prática."
                : "Você ainda não tem uma entrevista para praticar. Elabore a primeira a partir da vaga."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href={semMapa ? "/painel" : "/elaborar"}
                className="rounded-[3px] bg-fenix px-6 py-3 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
              >
                {semMapa ? "Voltar ao painel" : "Elaborar entrevista"}
              </Link>
              <Link href="/kits/demo/pratica" className="text-osso underline-offset-4 hover:underline">
                Experimentar com o kit de demonstração
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-fio border-y border-fio">
            {entrevistas.map(({ kit, tipo, vaga }, i) => {
              const pct = Math.round((kit.prontas / kit.total) * 100);
              const ultima = ultimaPorKit.get(kit.id);
              return (
                <li key={kit.id}>
                  <Link
                    href={`/kits/${kit.id}/pratica`}
                    className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-3 py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                  >
                    <Anel pct={pct} comMapa className="size-12" />
                    <span className="min-w-0">
                      <span className="block text-lg font-medium">{NOME_TIPO[tipo]}</span>
                      <span className="block truncate text-sm text-cinza-quente">
                        {[vaga.cargo ?? "Vaga sem cargo", vaga.empresa].filter(Boolean).join(", ")}, entrevista{" "}
                        {entrevistaEm(vaga.dias)}
                      </span>
                      <span className="mt-1 block text-sm text-cinza-quente">
                        {pct}% no Palco
                        {ultima &&
                          `. Última rodada: ${ultima.acertos} ${ultima.acertos === 1 ? "acerto" : "acertos"}, ${ultima.quase} quase, ${ultima.erros} ${ultima.erros === 1 ? "erro" : "erros"}`}
                        .
                      </span>
                    </span>
                    <span
                      className={`col-start-2 justify-self-start rounded-[3px] px-5 py-2.5 text-sm font-semibold transition-transform duration-200 ease-brasa group-hover:-translate-y-0.5 sm:col-start-3 ${
                        i === 0 && kit.aRevisar > 0 ? "bg-fenix text-noite" : "border border-fio text-osso"
                      }`}
                    >
                      {kit.aRevisar > 0
                        ? `Revisar ${kit.aRevisar} ${kit.aRevisar === 1 ? "resposta" : "respostas"}`
                        : "Praticar de novo"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
